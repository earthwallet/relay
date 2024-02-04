import * as BitcoinCore from 'bitcoin-core';

class BitcoinCoreClient {
    private client: any;
  
    constructor() {
        this.client = new BitcoinCore({
            host: process.env.BITCOIN_RPC_HOST,
            port: process.env.BITCOIN_RPC_PORT,
            username: process.env.BITCOIN_RPC_USER,
            password: process.env.BITCOIN_RPC_PASSWORD,
            network: process.env.BITCOIN_NETWORK,
        });
    }
  
    async getBlockchainInfo(): Promise<any> {
      try {
        const result = await this.client.getBlockchainInfo();
        return result;
      } catch (error) {
        throw new Error(`Error getBlockchainInfo: ${error.message}`);
      }
    }
}

export default BitcoinCoreClient;