import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: '0.8.24', settings: { optimizer: { enabled: true, runs: 200 } } }]
  },
  networks: {
    hederaTestnet: {
      url: process.env.HEDERA_TESTNET_RPC_URL ?? 'https://testnet.hashio.io/api',
      chainId: 296,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  sourcify: {
    enabled: true
  }
};

export default config;