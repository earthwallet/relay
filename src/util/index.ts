const NOSTR = {
  OK: 'OK',
  REQ: 'REQ',
  AUTH: 'AUTH',
  EOSE: 'EOSE',
  EVENT: 'EVENT',
  CLOSE: 'CLOSE',
  NOTICE: 'NOTICE'
};

const formatEvent = (subscriptionId: string, event: object) =>
  JSON.stringify([NOSTR.EVENT, subscriptionId, event]);

const formatEose = (subscriptionId: string) =>
  JSON.stringify([NOSTR.EOSE, subscriptionId]);

const formatNotice = (message) => JSON.stringify([NOSTR.NOTICE, message]);

const formatOk = (eventId: String) =>
  JSON.stringify([NOSTR.OK, eventId, true, '']);

const formatNotOk = (eventId: String, error: String) =>
  JSON.stringify([NOSTR.OK, eventId, false, error]);

const CLOSE_CODES = {
  SERVICE_RESTART: 1012
};

const SOCKET = {
  CONNECTION: 'connection',
  MESSAGE: 'message',
  ERROR: 'error'
};

export { NOSTR, formatEvent, formatNotice, formatOk, formatNotOk, formatEose, CLOSE_CODES, SOCKET };
