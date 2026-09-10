import {
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  Timestamp,
  TransactionId,
  TopicMessageSubmitTransaction
} from '@hashgraph/sdk';
import type { Envelope } from './types.js';

export interface HcsBusConfig {
  accountId: string;
  privateKey: string;
  rpcUrl: string;
  mirrorBase?: string;
  topicId: string;
  maxFeeHbar?: number;
}

export interface HcsMessage {
  consensusTs: string;
  payer: string;
  content: string;
}

/**
 * HCS data bus for the universal encumbrance registry.
 *
 * Publishing to a topic requires a transaction `validStart` that matches Hedera
 * network time. This machine's OS clock can lag the network, which causes
 * `TRANSACTION_EXPIRED` precheck failures, so the validStart is derived from
 * the latest EVM block timestamp of the JSON-RPC endpoint instead.
 */
export class HcsBus {
  private readonly config: Required<Pick<HcsBusConfig, 'accountId' | 'privateKey' | 'rpcUrl' | 'topicId'>>;
  private readonly mirrorBase: string;
  private readonly maxFeeHbar: number;

  constructor(config: HcsBusConfig) {
    this.config = config;
    this.mirrorBase = config.mirrorBase ?? 'https://testnet.mirrornode.hedera.com/api/v1';
    this.maxFeeHbar = config.maxFeeHbar ?? 1;
  }

  private async chainTimeSeconds(): Promise<number> {
    const res = await fetch(this.config.rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBlockByNumber', params: ['latest', false] })
    });
    const body = (await res.json()) as { result: { timestamp: string } };
    return parseInt(body.result.timestamp, 16);
  }

  /** Publish an envelope to the topic; returns the consensus timestamp. */
  async publish(envelope: Envelope): Promise<string> {
    const client = Client.forTestnet();
    client.setOperator(this.config.accountId, PrivateKey.fromStringECDSA(this.config.privateKey));
    client.setMaxTransactionFee(Hbar.fromTinybars(Math.round(this.maxFeeHbar * 100_000_000)));

    const chainSec = await this.chainTimeSeconds();
    const txId = TransactionId.withValidStart(
      AccountId.fromString(this.config.accountId),
      Timestamp.fromDate(new Date(chainSec * 1000))
    );

    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(this.config.topicId)
      .setMessage(JSON.stringify(envelope))
      .setTransactionId(txId)
      .freezeWith(client);

    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);
    client.close();
    return receipt.status.toString();
  }

  /** Fetch recent messages from the topic via the mirror node. */
  async read(limit = 100): Promise<HcsMessage[]> {
    const url = `${this.mirrorBase}/topics/${this.config.topicId}/messages?limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`mirror topic read failed: ${res.status}`);
    const body = (await res.json()) as { messages: Array<{ consensus_timestamp: string; payer_account_id: string; message: string }> };
    return body.messages.map((m) => ({
      consensusTs: m.consensus_timestamp,
      payer: m.payer_account_id,
      content: Buffer.from(m.message, 'base64').toString('utf8')
    }));
  }
}