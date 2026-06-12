import JsonRpcServer from './server';
import { getTransaction } from './getTransaction';

const rpcServer = new JsonRpcServer();

rpcServer.registerMethod('getTransaction', getTransaction);

export { rpcServer };