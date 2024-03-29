import { WebSocketServer } from 'ws';

import { SOCKET, CLOSE_CODES } from './util';
import handler from './handler/index';
import { formatNotice } from './util';
import { listenForNewBlocks } from './database/zmq';

import { createServer } from 'http';
import { parse } from 'url';
import * as client from 'prom-client';

import * as redis from './database/redis';
import { syncIndex } from './service/indexer';

// HTTP Server
const allowedOrigins = ['127.0.0.1', 'https://bitcoinstaking.com'];
const prom_active_subscriptions = new client.Gauge({
  name: 'nostr_active_subscriptions',
  help: 'Number of active subscriptions'
});
const prom_number_of_reqs = new client.Counter({
  name: 'nostr_number_of_reqs_recv',
  help: 'Number of active subscriptions'
});
const prom_number_of_events = new client.Counter({
  name: 'nostr_number_of_events_recv',
  help: 'Number of active subscriptions'
});

const prom_active_clients = new client.Gauge({
  name: 'nostr_number_of_active_clients',
  help: 'Number of active WS clients'
});

const prom_redis_health = new client.Gauge({
  name: 'nostr_relay_redis_connectivity_up',
  help: 'Whether connection to Redis is healthy'
});

const prom_redis_ratelimited_clients = new client.Counter({ name: 'prom_redis_ratelimited_clients', help: 'number of clients limited' });

const server = createServer(async (req, res) => {
  console.log(new Date() + ' Received HTTP request for ' + req.url + ' from ' + req.socket.remoteAddress);
  try {
    const { path } = parse(req.url);
    // Register the bitcoin staking endpoint
    if (path === '/blocks') {
      prom_active_clients.set(wss.clients.size);
      await redis.ping(prom_redis_health);
      res.setHeader('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } else {
      res.statusCode = 404;
      res.end();
    }
  } catch (error) {
    res.statusCode = 500;
    res.end(error);
  }
});

server.listen(parseInt(process.env.SERVER_PORT), '0.0.0.0', () => {
  console.log(`X server listening on port: ${process.env.SERVER_PORT}`);
});

// TODO: Check if initial sync or zmq should be enabled
syncIndex(Number(process.env.MIN_BLOCK_HEIGHT));

// listenForNewBlocks();

// WSS
const wss = new WebSocketServer({ server: server });

console.log(`PID: ${process.pid}`);
console.log(`Websocket server listening on port: ${process.env.SERVER_PORT}`);

// Open socket and pass event to the event handler
wss.on(SOCKET.CONNECTION, (ws, req) => {
  // Active subscriptions
  const subs = new Map();

  // Check for XFF header
  const xff = req.headers['x-forwarded-for'];
  if (xff) console.log(`[INFO]: Found XFF header ${xff}. Using in place of address ${req.socket.remoteAddress}`);

  // TODO: implement IP based access control when L2 rpc url is available
  // Set source IP
  const sourceAddress = xff ? xff.split(',')[0].trim() : req.socket.remoteAddress;

  // On Error
  ws.on(SOCKET.ERROR, (error) => {
    console.error(`Oops! Recieved this error: ${error}`);
  });

  // On Message
  ws.on(SOCKET.MESSAGE, (data) => {
    try {
      redis.limit(prom_redis_ratelimited_clients, sourceAddress, () => {
        const buf = Buffer.from(data);
        const message = buf.toString();

        console.log(`[RECV]: ${message}`);
        handler(
          ws,
          buf.toString(),
          subs,
          prom_active_subscriptions,
          prom_number_of_reqs,
          prom_number_of_events
        );
      });
    } catch (err) {
      console.error(err);
      ws.send(formatNotice('[ERROR]: Failed to parse message as a string!'));
    }
  });

  // If polling is enabled, start polling
  let interval;
  if (process.env.FF_POLL_SUBSCRIPTIONS == 'true') {
    // While connection is open, periodically poll subscriptions
    interval = setInterval(() => {
      subs.forEach(({ query }, key) => {
        console.log(
          `[POLL]: remote ${sourceAddress}, subscription ${key}, query ${query}`
        );
        handler(
          ws,
          query,
          subs,
          prom_active_subscriptions,
          prom_number_of_reqs,
          prom_number_of_events
        );
      });
    }, parseInt(process.env.LIVE_POLLING_INTERVAL))
  }

  // On Close
  ws.on('close', () => {

    // If polling is enabled, stop polling
    if (process.env.FF_POLL_SUBSCRIPTIONS == 'true' && interval) {
      clearInterval(interval);
    }
    
    clearInterval(interval);
    subs.forEach(() => {
      prom_active_subscriptions.dec();
    });
  });
});

// On TERM signal, close open connections with a Service Restart code
process.on('SIGTERM', (signal) => {
  console.log('Got signal ' + signal);
  wss.clients.forEach((ws) => {
    ws.close(CLOSE_CODES.SERVICE_RESTART, 'Service Restart');
  });
  process.exit();
});
