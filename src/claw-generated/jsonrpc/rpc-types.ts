export interface RPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params: any;
}

export interface RPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: RPCError;
}

export interface RPCError {
  code: number;
  message: string;
  data?: any;
}