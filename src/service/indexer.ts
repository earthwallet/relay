import * as bitcoin from 'bitcoinjs-lib';
import BitcoinCoreClient from '../repository/bitcoinCore';
import { putChainTip, getChainTip, saveBitcoinEvent, getEventById } from '../repository/postgres';

interface Block {
  hash: string;
  height: number;
  tx: string[];
}

interface Transaction {
  txid: string;
  vout: Vout[];
}

interface Vout {
  scriptPubKey: {
    asm: string;
    hex: string;
    type: string;
    addresses?: string[];
  };
}

async function syncIndex(minBlockHeight: number): Promise<void> {
  const client = new BitcoinCoreClient();

  try {
    // Get the latest chaintip from the database
    const latestChaintip = await getChainTip();
    let latestBlockHeight = parseInt(latestChaintip || minBlockHeight || 0);

    const currentBlockHeight = await client.getBlockCount();
    console.log('latestBlockHeight, currentBlockHeight', latestBlockHeight, currentBlockHeight);
    
    for (let i = latestBlockHeight + 1; i <= currentBlockHeight; i++) {
      const blockHash = await client.getBlockHash(i);
      const block = await client.getBlock(blockHash);
      await processBlock(block);
    }
  } catch (error) {
    console.error('Error fetching Bitcoin blocks:', error);
  }
}

async function processBlock(block: Block): Promise<void> {
  const client = new BitcoinCoreClient();

  for (const tx of block.tx) {
    const rawTx = await client.getRawTransaction(tx);
    const transaction = bitcoin.Transaction.fromHex(rawTx);
    if (!transaction || !transaction.ins) continue;
    for (const input of transaction.ins) {
      for (const witness of input.witness) {
        if (!witness) continue;
        const decodedScript = decodeBitcoinScript(witness);
        if (!decodedScript) continue;
        // Check if the witness script data has 'sn' envelope
        if (decodedScript.includes(' 736e ')) {
          const { eventId, eventType } = extractEventFromScript(decodedScript);
          if (eventId) {
            // save to DB
            const event = {
              network: process.env.BITCOIN_NETWORK || 'mainnet',
              bpubkey: decodedScript.split(' ')[0],
              block_height: block.height,
              txid: tx,
              content: eventId,
              type: eventType,
            };
            console.log('ready to save event', event);
            await saveBitcoinEvent(event);

            if (eventType === 'stake') {
              const eventExistsOnNostr = await getEventById(eventId);
              if (eventExistsOnNostr) {
                console.log('Event exists on Nostr');
                // TODO: validate signature 
                // updateBitcoinEvent(event.content, true, true);
              }
            }
          }
        }
      }
    }
  }
  // Save latest chaintip to database
  await putChainTip(block.height);
}

function decodeBitcoinScript(script: Buffer): string {
  try {
    return bitcoin.script.toASM(script)
  } catch (error) {
    return '';
  }
}

function extractEventFromScript(script: string): {eventId: string, eventType: string} {
  try {
    const stakeEventId = script.split(' 736e ')[1].split('77 ')[1]?.split('OP_0 ')[1]?.split(' ')[0];
    const storageEventId = script.split(' 736e ')[1].split('369 ')[1]?.split('OP_0 ')[1]?.split(' ')[0];
    console.log('stakeEventId', stakeEventId);
    console.log('storageEventId', storageEventId);

    return {
      eventId: stakeEventId || storageEventId,
      eventType: stakeEventId ? 'stake' : 'storage'
    }
  } catch (error) {
    return null;
  }
}

export { syncIndex };