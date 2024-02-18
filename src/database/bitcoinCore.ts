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

  async getBlock(blockHash: string): Promise<any> {
    try {
      const result = await this.client.getBlock(blockHash);
      console.log('getBlock result', result);
      return result;
    } catch (error) {
      throw new Error(`Error getBlock: ${error.message}`);
    }
  }

  async getBlockCount(): Promise<number> {
    try {
      const result = await this.client.getBlockCount();
      return result;
    } catch (error) {
      throw new Error(`Error getBlockCount: ${error.message}`);
    }
  }

  async getBlockHash(blockHeight: number): Promise<string> {
    try {
      const result = await this.client.getBlockHash(blockHeight);
      console.log('getBlockHash result', result);
      return result;
    } catch (error) {
      throw new Error(`Error getBlockHash: ${error.message}`);
    }
  }

  async getTransaction(txid: string): Promise<any> {
    try {
      const result = await this.client.getTransaction(txid);
      console.log('getTransaction result', result);
      return result;
    } catch (error) {
      throw new Error(`Error getTransaction: ${error.message}`);
    }
  }

  async getRawTransaction(txid: string): Promise<string> {
    try {
      const result = await this.client.getRawTransaction(txid);
      return result;
    } catch (error) {
      throw new Error(`Error getRawTransaction: ${error.message}`);
    }
  }
}

export default BitcoinCoreClient;