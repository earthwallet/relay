import * as zmq from 'zeromq';
import * as bitcoin from 'bitcoinjs-lib';
import BitcoinCoreClient from './bitcoinCore';

const bitcoinCoreClient = new BitcoinCoreClient();
const bitcoinZmqAddress = `tcp://${process.env.BITCOIN_RPC_HOST}:${process.env.BITCOIN_ZMQ_PORT}`;

export const listenForNewBlocks = () => {
    console.log('listening for new blocks on', bitcoinZmqAddress);
    const sock = zmq.socket('sub');
    sock.connect(bitcoinZmqAddress);
    sock.subscribe('rawblock');
    sock.on('message', async (topic, message) => {
        try {
            if (topic.toString() === 'rawblock') {
                const block = bitcoin.Block.fromBuffer(message);
                console.log('received block ', block.getId(), block.transactions.length);

                block.transactions.forEach(async (transaction) => {
                    const transactionId = transaction.getId();
                    console.log('transactionId', transactionId);

                    // TODO: process this transaction and check for any tx with sn envelope
                });

                const blockchainInfo = await bitcoinCoreClient.getBlockchainInfo();
                console.log('block height', blockchainInfo.blocks);
                // TODO: update chaintip in DB
            }
        } catch (error) {
            console.log('failed to process the block ', error.message);
        }
    });
}