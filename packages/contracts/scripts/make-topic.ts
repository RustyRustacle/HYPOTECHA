import dotenv from 'dotenv';
import { resolve } from 'path';
import { AccountId, Client, Hbar, PrivateKey, Timestamp, TransactionId, TopicCreateTransaction } from '@hashgraph/sdk';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const RPC = 'https://testnet.hashio.io/api';

async function chainTimeSeconds(): Promise<number> {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBlockByNumber', params: ['latest', false] })
  });
  const body = (await res.json()) as { result: { timestamp: string } };
  return parseInt(body.result.timestamp, 16);
}

async function main() {
  const accountId = process.env.ACCOUNT_ID!;
  const privKey = process.env.PRIVATE_KEY!;
  const evmAddress = process.env.EVM_ADDRESS!;

  // Build a transactionId whose validStart matches Hedera chain time (this machine's
  // clock lags the network, so defaultValue would be rejected as TRANSACTION_EXPIRED).
  const chainSec = await chainTimeSeconds();
  const offsetSeconds = chainSec - Math.floor(Date.now() / 1000);
  const validStart = Timestamp.fromDate(new Date(chainSec * 1000));
  const txId = TransactionId.withValidStart(AccountId.fromString(accountId), validStart);

  const client = Client.forTestnet();
  client.setOperator(accountId, PrivateKey.fromStringECDSA(privKey));
  client.setMaxTransactionFee(Hbar.fromTinybars(1_000_000_000));

  const tx = new TopicCreateTransaction()
    .setTopicMemo('Hypotheca universal encumbrance registry (public topic)')
    .setTransactionId(txId)
    .freezeWith(client);

  console.log('chain time', chainSec, 'local', Math.floor(Date.now() / 1000), 'offset', offsetSeconds);
  console.log('executing topic create ...');
  const resp = await tx.execute(client);
  const receipt = await resp.getReceipt(client);
  const topicId = receipt.topicId!.toString();
  console.log('HCS_TOPIC_ID', topicId);

  client.close();
}

main()
  .catch((e) => {
    console.error('FAILED:', e);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(process.exitCode || 0), 500));