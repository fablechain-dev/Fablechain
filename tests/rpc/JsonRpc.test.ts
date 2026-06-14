```typescript
import axios, { AxiosError } from 'axios';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown[];
  id: string | number | null;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number | null;
}

describe('JsonRpc Server Integration Tests', () => {
  let serverProcess: ChildProcess;
  const RPC_URL = 'http://localhost:8545';
  const REQUEST_TIMEOUT = 5000;

  beforeAll(async () => {
    return new Promise<void>((resolve, reject) => {
      serverProcess = spawn('node', [path.join(__dirname, '../../src/rpc/server.js')], {
        env: {
          ...process.env,
          NODE_ENV: 'test',
          RPC_PORT: '8545',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          serverProcess.kill();
          reject(new Error('Server failed to start within timeout'));
        }
      }, 10000);

      serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('listening') || output.includes('started')) {
          serverReady = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error('Server stderr:', data.toString());
      });

      serverProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
  });

  describe('Happy Path Tests', () => {
    it('should handle eth_blockNumber request successfully', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      };

      const response = await axios.post<JsonRpcResponse<string>>(RPC_URL, request, {
        timeout: REQUEST_TIMEOUT,
      });

      expect(response.status).toBe(200);
      expect(response.data.jsonrpc).toBe('2.0');
      expect(response.data.id).toBe(1);
      expect(response.data.result).toBeDefined();
      expect(response.data.error).toBeUndefined();
      expect(typeof response.data.result).toBe('string');
      expect(response.data.result).toMatch(/^0x[0-9a-f]+$/i);
    });

    it('should handle eth_gasPrice request successfully', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        id: 2,
      };

      const response = await axios.post<JsonRpcResponse<string>>(RPC_URL, request, {
        timeout: REQUEST_TIMEOUT,
      });

      expect(response.status).toBe(200);
      expect(response.data.result).toBeDefined();
      expect(response.data.result).toMatch(/^0x[0-9a-f]+$/i);
      expect(response.data.error).toBeUndefined();
    });

    it('should handle eth_chainId request successfully', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'eth_chainId',
        id: 3,
      };

      const response = await axios.post<JsonRpcResponse<string>>(RPC_URL, request, {
        timeout: REQUEST_TIMEOUT,
      });

      expect(response.status).toBe(200);
      expect(response.data.result).toBeDefined();
      expect(response.data.result).toMatch(/^0x[0-9a-f]+$/i);
    });

    it('should handle batch requests', async () => {
      const requests: JsonRpcRequest[] = [
        {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          id: 1,
        },
        {
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          id: 2,
        },
      ];

      const response = await axios.post<JsonRpcResponse[]>(RPC_URL, requests, {
        timeout: REQUEST_TIMEOUT,
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].id).toBe(1);
      expect(response.data[1].id).toBe(2);
      expect(response.data[0].result).toBeDefined();
      expect(response.data[1].result).toBeDefined();
    });

    it('should handle request with null id', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        id: null,
      };

      const response = await axios.post<JsonRpcResponse<string>>(RPC_URL, request, {
        timeout: REQUEST_TIMEOUT,
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBeNull();
      expect(response.data.result).toBeDefined();
    });
  });

  describe('Malformed Request Tests', () => {
    it('should reject request with missing jsonrpc version', async () => {
      const request = {
        method: 'eth_blockNumber',
        id: 1,
      };

      try {
        await axios.post(RPC_URL, request, { timeout: REQUEST_TIMEOUT });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError<JsonRpcResponse>;
        expect(axiosError.response?.status).toBe(400);
        expect(axiosError.response?.data?.error?.code).toBe(-32600);
        expect(axiosError.response?.data?.error?.message).toContain('Invalid Request');
      }
    });

    it('should reject request with missing method', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
      };

      try {
        await axios.post(RPC_URL, request, { timeout: REQUEST_TIMEOUT });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError<JsonRpcResponse>;
        expect(axiosError.response?.status).toBe(400);
        expect(axiosError.response?.data?.error?.code).toBe(-32600);
      }
    });

    it('should reject request with invalid jsonrpc version', async () => {
      const request = {
        jsonrpc: '1.0',
        method: 'eth_blockNumber',
        id: 1,
      };

      try {
        await axios.post(RPC_URL, request, { timeout: REQUEST_TIMEOUT });
        fail('Should have thrown an error');
      } catch (error) {
        const axiosError = error as AxiosError<JsonRpcResponse>;
        expect(axiosError.response?.status).toBe(400);
        expect(axiosError.response?.data?.error?.code).toBe(-32600);
      }
    });

    it('should reject malformed JSON', async () => {
      try {
        await axios.post(RPC_URL, '{invalid json}', {