import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: '0.8.24' }]
  },
  networks: {
    hederaTestnet: {
      url: process.env.HEDERA_TESTNET_RPC_URL ?? 'https://testnet.hashio.io/api',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};

export default config;
