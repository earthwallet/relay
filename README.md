# Earth Relay

Earth Relay is an open source implementation of the Social Network Layer Two scaling solutino for Bitcoin. It features a decentralized architecture using a DHT for peer discovery and Nostr for data availability and verification.

## Features

- Distributed hash table (DHT) based on Kademlia for decentralized peer discovery and data storage
- Secured using secp256k1 public key cryptography
- Storage of Nostr social events and messaging
- Indexing of Bitcoin Social Network transactions for 2-way pegging between Social Network and Bitcoin
- Caching of Layer 2 zkRollup data availability
- WebSocket and REST APIs for clients to submit Bitcoin Staking events
[ ] Add Bitcoin stake event listener
    - user stores nostr stake event with amount deposited
    - validate the signature is correct
    - store in postgres
[ ] Add X signer RPC endpoint
    - Gets all stake events, optional block range flag
    - X creates mint signatures based off of these
[ ] Easy deployment with Docker

## Architecture

Earth Relay implements a DHT that handles peer discovery and acts as a distributed storage mechanism. Peers connect to each other directly via UDP to exchange Nostr storage events, and users can connect to an Earth Relay via standard Nostr Websocket events. The DHT provides a backup store of events and allows finding peers efficiently.

Event data is indexed in the DHT to generate a reliable way to ensure all important staking activities are gossiped through the Social Network. Other Earth Relays can also view this data via the Earth Relay API.

Availability of zkRollup data is tracked in the DHT to improve access latency. Peers can quickly locate zkRollup data blocks through the relay network, without ever relying on a single node.

## Implemented NIPs

✅ - Implemented
🚧 - In Progress / Partially Implemented
❌ - Not (Yet) Implemented

| NIP      | Status |
| -------- | ------ |
| NIP-01   | ✅     |
| NIP-02   | ❌     |
| NIP-03   | ❌     |
| NIP-04   | ❌     |
| NIP-05   | 🚧     |
| NIP-06   | ❌     |
| NIP-07   | ❌     |
| NIP-08   | ✅     |
| NIP-09   | ✅     |
| NIP-10   | ✅     |
| NIP-11   | ❌     |
| NIP-12   | ❌     |
| NIP-13   | ❌     |
| NIP-14   | ❌     |
| NIP-15   | ❌     |
| NIP-16   | ❌     |
| NIP-26   | 🚧     |

## Getting Started

### Requirements:

This project is built with [Node.js](https://nodejs.org/), and uses `npm` for dependency mangement.

### Running Earth Relay:

You can install the project dependencies and start locally with:

```bash
cp .env.example .env
npm i
npm run dev
```

### Connecting a client:

```
// JS example 
const ws = new WebSocket("ws://localhost:5000");

ws.onmessage = (evt) => {
  const event = JSON.parse(evt.data);
  
  if (event.kind === 2) {
    // New event received
  }
}

ws.send(JSON.stringify({...})); // Send event
```

See the Nostr API docs for details on integrating with clients.

Currently only requesting specific events by the unique hash is supported. One simple way to test this is by using the [noscl](https://github.com/fiatjaf/noscl) command line client for Nostr (this is the tool used in the integration tests).

For example:

```bash
noscl relay add ws://localhost:8000/nostr/v1/ws # Default K3s Ingress port used when running k3d:up

noscl event <event_hash>
```

### Execute Tests

We have unit tests witten with [Jest](https://jestjs.io/). You can run the tests with this command:

```bash
npm test
```

## Contributing

Earth Relay is open source and contributions are welcome! Check out the code on GitHub.


## Nostr event indexing
1- Check and update `scripts/simulateTx.js` with the event type you want to simulate.  
2- run `npm run scripts:start` to generate a deposit address  
3- fund the address from local regtest miner  
```
bitcoin-cli -rpcwallet=miner sendtoaddress bcrt1pqdfpelza9z852uwcgju8nu5cz2ecg6glt4rqljleqcslq4nxmu4stlwspc 0.1
bitcoin-cli -rpcwallet=miner -generate 1
```
4- update fundingTx inside `scripts/simulateTx.js` with the sent transaction id  
5- run the script again to generate a valid raw earth event transaction  
6- broadcast this tx  
7- run the local postgres `npm run db:start:local`  
8- run the relay `npm run dev` while using local regtest node and observe the indexing of this event.  
9- confirm that the event is in DB, make sure sync is completed and indexer is synced up to chaintip.
```
PGPASSWORD='postgres' psql -h localhost -U postgres
\c defaultdb;
select * from chaintip;
214
select * from bitcoin_events;
 regtest | b65c844ea6321ef42ffe21e1c5b7018b07f0aac07540dcc7c90b4e79a13be335 |          198 | 9a6a37ca82343c3d952207ded7626dc07d888b34c4b79995f900cdb2a28
6a477 | 64756d6d796576656e746964 |    
  | stake
```  