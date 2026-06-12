import express from 'express';
import { faucetRoute } from './faucet';

const app = express();

app.use('/faucet', faucetRoute);

app.listen(3000, () => {
  console.log('Server started on port 3000');
});