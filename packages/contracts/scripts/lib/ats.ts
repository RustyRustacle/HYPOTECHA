import { AccountId } from '@hashgraph/sdk';
import { ethers } from 'hardhat';

export const PARTITION_ID_1 = '0x0000000000000000000000000000000000000000000000000000000000000001';

export const ROLES = {
  DEFAULT_ADMIN: '0x0000000000000000000000000000000000000000000000000000000000000000',
  ISSUER: '0x5eeaf5602c75bf26e73b5206d0bd6ee82f621166255e5fd73cc06bc7bd84a95f',
  CONTROLLER: '0xb4d2b850c3ed8a234d390d5c157bbb1824883213c335ffe2a0f0761bb168713e'
} as const;

const MAX_GAS = 15_000_000;

export function toEvmAddress(accountIdLike: string): string {
  const id = AccountId.fromString(accountIdLike);
  return '0x' + id.toSolidityAddress();
}

export function toHederaId(entity: string): string {
  return `0.0.${BigInt(entity).toString(10)}`;
}

function byteToCode(ch: string): number {
  const code = ch.charCodeAt(0);
  return code > 57 ? code - 55 : code - 48;
}

export function makeIsin(payload11: string): string {
  if (payload11.length !== 11) throw new Error('payload must be 11 chars');
  const conv: number[] = [];
  for (let i = 0; i < 11; ++i) {
    const code = byteToCode(payload11[i]);
    if (code > 9) {
      conv.push(Math.floor(code / 10), code % 10);
    } else {
      conv.push(code);
    }
  }
  const pairing = (conv.length + 1) % 2;
  let checksum = 0;
  for (let i = 0; i < conv.length; ++i) {
    const val = conv[i] * ((i % 2) === pairing ? 2 : 1);
    if (val > 9) {
      checksum += Math.floor(val / 10) + (val % 10);
    } else {
      checksum += val;
    }
  }
  const digit = (10 - (checksum % 10)) % 10;
  return payload11 + String(digit);
}

export async function getProvider() {
  return ethers.provider;
}

export async function getSigner() {
  const [signer] = await ethers.getSigners();
  return signer;
}

export { MAX_GAS };