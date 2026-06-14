```typescript
import axios, { AxiosError } from 'axios';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown[];
  id?: string | number | null;
}

interface JsonRpcResponse {
  jsonrpc: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id?: string | number | null;
}

describe('JSON-RPC Server Integration Tests', () => {
  let serverProcess: ChildProcess;
  const SERVER_URL = 'http://localhost:8545';
  const REQUEST_TIMEOUT = 5000;

  beforeAll((done) => {
    serverProcess = spawn('node', [
      path.join(__dirname, '../../src/rpc/server.js')
    ], {
      stdio: 'pipe',
      env: {
        ...process.env,
        RPC_PORT: '8545',
        RPC_HOST: 'localhost'
      }
    });

    serverProcess.stdout?.on('data', (data) => {
      if (data.toString().includes('JSON-RPC server listening')) {
        done();
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    setTimeout(() => done(), 3000);
  });

  afterAll((done) => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      serverProcess.on('exit', () => done());
      setTimeout(() => {
        serverProcess.kill('SIGKILL');
        done();
      }, 1000);
    } else {
      done();
    }
  });

  describe('Happy Path Tests', () => {
    it('should handle eth_blockNumber request successfully', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      };

      const response = await axios.post<JsonRpcResponse>(SERVER_URL, request, {
        timeout: REQUEST_TIMEOUT
      });

      expect(response.status).toBe(200);
      expect(response.data.jsonrpc).toBe('2.0');
      expect(response.data.id).toBe(1);
      expect(response.data.result).toBeDefined();
      expect(response.data.error).toBeUndefined();
      expect(typeof response.data.result).toBe('string');
    });

    it('should handle eth_getBalance request successfully', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: ['0x742d35Cc6634C0532925a3b844Bc9e7595f42bE', 'latest'],
        id: 2
      };

      const response = await axios.post<JsonRpcResponse>(SERVER_URL, request, {
        timeout: REQUEST_TIMEOUT
      });

      expect(response.status).toBe(200);
      expect(response.data.jsonrpc).toBe('2.0');
      expect(response.data.id).toBe(2);
      expect(response.data.result).toBeDefined();
      expect(response.data.error).toBeUndefined();
    });

    it('should handle web3_clientVersion request', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'web3_clientVersion',
        id: 3
      };

      const response = await axios.post<JsonRpcResponse>(SERVER_URL, request, {
        timeout: REQUEST_TIMEOUT
      });

      expect(response.status).toBe(200);
      expect(response.data.jsonrpc).toBe('2.0');
      expect(response.data.id).toBe(3);
      expect(response.data.result).toMatch(/Fablechain/i);
      expect(response.data.error).toBeUndefined();
    });

    it('should handle requests without id field (notification)', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: []
      };

      const response = await axios.post<JsonRpcResponse>(SERVER_URL, request, {
        timeout: REQUEST_TIMEOUT
      });

      expect(response.status).toBe(200);
      expect(response.data.result).toBeDefined();
    });

    it('should handle batch requests', async () => {
      const requests: JsonRpcRequest[] = [
        {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          id: 1
        },
        {
          jsonrpc: '2.0',
          method: 'web3_clientVersion',
          id: 2
        }
      ];

      const response = await axios.post<JsonRpcResponse[]>(
        SERVER_URL,
        requests,
        { timeout: REQUEST_TIMEOUT }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].id).toBe(1);
      expect(response.data[1].id).toBe(2);
      expect(response.data[0].result).toBeDefined();
      expect(response.data[1].result).toBeDefined();
    });
  });

  describe('Malformed Request Tests', () => {
    it('should reject request with invalid JSON', async () => {
      try {
        await axios.post(SERVER_URL, 'invalid json {', {
          timeout: REQUEST_TIMEOUT,
          headers: { 'Content-Type': 'application/json' }
        });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError<JsonRpcResponse>;
        expect([400, 500]).toContain(axiosError.response?.status);
        expect(axiosError.response?.data?.error?.code).toBeDefined();
      }
    });

    it('should reject request missing jsonrpc field', async () => {
      const request = {
        method: 'eth_blockNumber',
        params: [],
        id: 1
      };

      const response = await axios.post<JsonRpcResponse>(SERVER_URL, request, {
        timeout: REQUEST_TIMEOUT,
        validateStatus: () => true
      });

      expect(response.data.error).toBeDefined();
      expect(response.data.error?.code).toBe(-32600);
      expect(response.data.error?.message).toMatch(/Invalid Request/i);
    });

    it('should reject request with invalid jsonrpc version', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '1.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      };

      const response = await axios.post<JsonRpcResponse>(SERVER_URL, request, {
        timeout: REQUEST_TIMEOUT,
        validateStatus: () => true
      });

      expect(response.data.error).toBeDefined();
      expect(response.data.error?.code).toBe(-32600);
    });

    it('should reject request missing method field', async () => {
      const request = {
        jsonrpc: '2.0',
        params: [],
        id: 1
      };

      const response = await axios.post<JsonRpcResponse>(SERVER_URL, request, {
        timeout: REQUEST_TIMEOUT,
        validateStatus: () => true
      });

      expect(response.data.error).toBeDefined();
      expect(response.data.error?.code).toBe(-32600);
    });

    it('should reject request with non-array params', async () => {
      const request = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params