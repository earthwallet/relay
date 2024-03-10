const { Address, Script, Signer, Tap, Tx, SecretKey } = require('@cmdcode/tapscript')
const {
    keys,
  } = require('@cmdcode/crypto-tools');
const bitcoin = require('bitcoinjs-lib');

const network = 'regtest';
// final receive address of the reveal tx
const receiveAddress = 'bcrt1pqdfpelza9z852uwcgju8nu5cz2ecg6glt4rqljleqcslq4nxmu4stlwspc';
const postage = 546;
const feeRate = 1;

async function createAddress(eventId, eventType) {
    // The 'marker' bytes. Part of the ordinal inscription format.
    const marker   = Buffer.from('sn')
    /* Specify the media type of the file. Applications use this when rendering 
    * content. See: https://developer.mozilla.org/en-US/docs/Glossary/MIME_type 
    */
    const content  = Buffer.from(`${eventId}`)
    let eventTag;
    switch (eventType) {
        case 'stake':
            eventTag = '77';
            break;
        case 'storage':
            eventTag = '369';
            break;
        default:
            eventTag = '77';
            break;
    }
    // Create a keypair to use for testing.
    // const seckey = keys.gen_seckey();

    // sample key for bcrt1pqdfpelza9z852uwcgju8nu5cz2ecg6glt4rqljleqcslq4nxmu4stlwspc
    const seckey = new Uint8Array(
        [
            101, 200, 141,  97,  62, 255, 135,
            241, 200, 155, 147, 104,  48, 183,
            220, 178, 197, 107, 121, 123, 245,
             55,   4,  95,  29, 125, 111,  72,
            173,  23, 162, 228
        ]
    );
    const pubkey = keys.get_pubkey(seckey, true);
    // Basic format of an 'inscription' script.
    const script  = [ 
        pubkey, 
        'OP_CHECKSIG', 
        'OP_0', 
        'OP_IF', 
        marker, 
        eventTag,
        'OP_0', 
        content, 
        'OP_ENDIF', 
    ];
    // For tapscript spends, we need to convert this script into a 'tapleaf'.
    const tapleaf = Tap.encodeScript(script)
    // Generate a tapkey that includes our leaf script. Also, create a merlke proof 
    // (cblock) that targets our leaf and proves its inclusion in the tapkey.
    const [ tpubkey, cblock ] = Tap.getPubKey(pubkey, { target: tapleaf })
    // A taproot address is simply the tweaked public key, encoded in bech32 format.
    const address = Address.p2tr.fromPubKey(tpubkey, network)
    console.log('Address:', address)

    return {
        seckey,
        pubkey,
        script,
        address,
        tapleaf,
        cblock,
        tpubkey,
    };
}

async function revealIt(data, receiveAddress) {
    const {
        seckey,
        pubkey,
        script,
        address,
        tapleaf,
        cblock,
        tpubkey,
        fundingTx,
    } = data;

    /* NOTE: To continue with this example, send 100_000 sats to the above address.
    * You will also need to make a note of the txid and vout of that transaction,
    * so that you can include that information below in the redeem tx.
    */ 

    const txdata = Tx.create({
        vin  : [{
            // Use the txid of the funding transaction used to send the sats.
            txid: fundingTx.id,
            // Specify the index value of the output that you are going to spend from.
            vout: fundingTx.vout,
            // Also include the value and script of that ouput.
            prevout: {
                // Feel free to change this if you sent a different amount.
                value: fundingTx.amount,
                // This is what our address looks like in script form.
                scriptPubKey: [ 'OP_1', tpubkey ]
            },
        }],
        vout : [
            {
                value: postage,
                // This is the new script that we are locking our funds to.
                scriptPubKey: Address.toScriptPubKey(receiveAddress)
            }
        ]
    })
    
    txdata.vout.push({
        value: fundingTx.amount - postage - (feeRate * 200), // return the change
        scriptPubKey: Address.toScriptPubKey(address)
    });
    
    // For this example, we are signing for input 0 of our transaction,
    // using the untweaked secret key. We are also extending the signature 
    // to include a commitment to the tapleaf script that we wish to use.
    const sig = Signer.taproot.sign(seckey, txdata, 0, { extension: tapleaf })
    
    // Add the signature to our witness data for input 0, along with the script
    // and merkle proof (cblock) for the script.
    txdata.vin[0].witness = [ sig, script, cblock ]
    
    // Check if the signature is valid for the provided public key, and that the
    // transaction is also valid (the merkle proof will be validated as well).
    const isValid = await Signer.taproot.verify(txdata, 0, { pubkey, throws: true })
    console.log('Transaction is valid:', isValid)

    const { hex } = Tx.encode(txdata);
    return {hex, txdata};
    
    // You can publish your transaction data using 'sendrawtransaction' in Bitcoin Core, or you 
    // can use an external API (such as https://mempool.space/docs/api/rest#post-transaction).
}

async function run() {
    const data = await createAddress('dummyeventid', 'stake');
    console.log(data);
    // Step-1 
    // generate an address by running this script "npm run scripts:start"
    // Step-2
    // fund the address with 10_000_000 sats
    // bitcoin-cli -rpcwallet=miner sendtoaddress bcrt1pqdfpelza9z852uwcgju8nu5cz2ecg6glt4rqljleqcslq4nxmu4stlwspc 0.1
    // bitcoin-cli -rpcwallet=miner -generate 1
    // wait for the transaction to confirm, populate below info and then run it again
    data.fundingTx = {
        id: '817aab7a4348cff73c69fa3246b86ff11efae36dc28bb009e1dc0b6c92d49287',
        vout: 0,
        amount: 10_000_000
    };
    const { hex, txdata } = await revealIt(data, receiveAddress);
    // Step-3
    // broadcast the transaction
    // bitcoin-cli sendrawtransaction <hex>
    console.log('broadcast this: ', hex);
    const tx = bitcoin.Transaction.fromHex(hex);
    const txid = tx.getId();
    console.log('txid', txid);
}

run()
