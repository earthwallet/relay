//@ts-nocheck
const secp256k1 = require('secp256k1');
const dgram = require('dgram');

// DHT configuration
const EARTH_NODE_PORT = 7777;
const EARTH_BOOTSTRAP_NODES = [
  { host: '123.45.67.89', port: process.env.EARTH_PORT },
  { host: '98.76.54.321', port: process.env.EARTH_PORT }
];

// Local node's keypair 
let localPrivateKey;
let localPublicKey;

// Routing table of known nodes
const routingTable = new Map(); 

// Store of data hashes mapped to locations
const dataStore = new Map();

// Generate local node keypair
function generateKeypair() {
  const {privateKey, publicKey} = secp256k1.generateKeypair();
  localPrivateKey = privateKey;
  localPublicKey = publicKey;
}

// Bootstrap connections to known nodes 
function bootstrapConnections() {
  for (const node of EARTH_BOOTSTRAP_NODES) {
    const socket = dgram.createSocket('udp4');
    socket.connect(node.port, node.host);

    // Add node to routing table
    routingTable.set(node.host, {
      socket: socket,
      publicKey: null // to be filled later
    });

    // Send find_node message to discover neighbors
    findNeighbors(node.host); 
  }
}

// Lookup closest nodes to a target id
function findNeighbors(eventId) {
  const message = JSON.stringify({
    t: 'find_node',
    target: eventId
  });
  signAndSendToNodes(message, eventId);
}

// Store data at nodes closest to target id 
function storeData(data, eventId) {
  const message = JSON.stringify({
    t: 'store', 
    data: data
  });

  signAndSendToNodes(message, eventId);
}

// Lookup data by target id
function lookupData(eventId) {
  const message = JSON.stringify({
    t: 'find_data',
    target: eventId
  });

  signAndSendToNodes(message, eventId); 
}

// Sign and send message to K closest nodes 
function signAndSendToNodes(message, eventId) {
  // Look up K closest nodes
  const nearestNodes = findNeighbors(eventId, K);

  // Sign message with local private key
  const signature = secp256k1.sign(message, localPrivateKey);

  // Send message to each neighbor
  for (const node of nearestNodes) {
    const packet = Buffer.concat([
      encodePacketHeader(localPublicKey, signature), 
      Buffer.from(message)
    ]);

    node.socket.send(packet, node.port, node.host);
  }
}

// Hearbeat protocol to discover new nodes
function heartbeat() {
  // Ping all known nodes
  for (const node of routingTable.values()) {
    ping(node);
  } 

  // Randomly ping other nodes to discover new ones
  const randomId = crypto.randomBytes(20);
  findNeighbors(randomId);

  // Refresh buckets
  refreshRoutingTable();
}

// Ping known node 
function ping(node) {
  const message = JSON.stringify({
    t: 'ping',
    id: localPublicKey
  });

  signAndSendToNodes(node.socket, message);
}

// Encode packet header 
function encodePacketHeader(publicKey, signature) {
  return Buffer.concat([
    publicKey, // 32 bytes
    signature // 64 bytes
  ]); 
}

// Refresh the routing table buckets
function refreshRoutingTable() {
  // Go through each bucket
  // Ping old nodes that haven't been seen
  // Add new nodes
  // Remove stale nodes
}

// Send the K closest nodes to the target
function sendClosestNodes(eventId, remote) {
  const nearestNodes = findNeighbors(eventId);

  const message = JSON.stringify({
    t: 'closest_nodes',
    nodes: nearestNodes
  });

  signAndSendToNodes(remote.socket, message);
}

// Receive incoming messages
function onMessage(message, remote) {
  // Decode packet
  const { publicKey, signature, data } = decodePacket(message);

  // Validate signature
  if (!verifySignature(data, publicKey, signature)) {
    console.error('Invalid signature');
    return;
  }

  const request = JSON.parse(data);

  switch(request.t) {
    case 'ping':
      // Reply with a pong
      pong(remote, request.id);
      break;

    case 'pong':
      // Verify node is alive
      routingTable.get(remote.address).alive = true;
      break;
    
    case 'find_node': 
      // Reply with K closest nodes to target
      sendClosestNodes(request.target, remote);
      break;

    case 'find_data':
      // Lookup data in store
      const result = lookupData(request.target);
      if (result) {
        sendData(result, remote);  
      } else {
        sendClosestNodes(request.target, remote);
      }
      break;

    case 'store':
      // Store data 
      storeData(request.data, request.target);
      break;
  }
}

// Main DHT entry point 
export function startDHT() {
  generateKeypair();
  bootstrapConnections();

  const socket = dgram.createSocket('udp4');

  socket.on('message', onMessage);

  setInterval(heartbeat, HEARTBEAT_INTERVAL);
}