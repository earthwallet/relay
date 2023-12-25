import * as mysql from 'mysql2/promise';
import Event from '../model/event';

const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || null,
    database: process.env.MYSQL_DATABASE
  });
}

// {
//   "ids": <a list of event ids or prefixes>,
//   "authors": <a list of pubkeys or prefixes, the pubkey of an event must be one of these>,
//   "kinds": <a list of a kind numbers>,
//   "#e": <a list of event ids that are referenced in an "e" tag>,
//   "#p": <a list of pubkeys that are referenced in a "p" tag>,
//   "since": <an integer unix timestamp in seconds, events must be newer than this to pass>,
//   "until": <an integer unix timestamp in seconds, events must be older than this to pass>,
//   "limit": <maximum number of events to be returned in the initial query>
// }

export const getEvents = async (filters: any) => {

  const connection = await getConnection();

  let statement = `
    SELECT DISTINCT e.* FROM nostr_events e
    LEFT OUTER JOIN nostr_replies r ON e.id=r.id
    LEFT OUTER JOIN nostr_mentions m ON e.id=m.id
  `;

  const where = [];

  if (filters.ids) {
    where.push(`e.id LIKE ${filters.ids.map(x => `'${x}%'`).join(' OR e.id LIKE ')}`);
  }

  if (filters.authors) {
    where.push(`e.pubkey IN (${filters.authors.map(x => `'${x}'`).join(',')})`);
  }

  if (filters.kinds) {
    where.push(`e.kind IN (${filters.kinds.map(x => `'${x}'`).join(',')})`);
  }

  if (filters['#e']) {
    where.push(`r.event_id IN (${filters['#e'].map(x => `'${x}'`).join(',')})`);
  }

  if (filters['#p']) {
    where.push(`m.pubkey IN (${filters['#p'].map(x => `'${x}'`).join(',')})`);
  }

  if (filters.since) {
    where.push(`e.created_at >= FROM_UNIXTIME(${filters.since})`);
  }

  if (filters.until) {
    where.push(`e.created_at <= FROM_UNIXTIME(${filters.until})`);
  }

  if (where.length) {
    where.push("(e.deleted = 0 OR e.deleted IS NULL)"); // Only return non-deleted events
    statement += " WHERE " + where.join(' AND ');
  }

  // Append LIMIT
  if (filters.limit) {
    filters.limit <= 500 ? filters.limit : 500; // cap limit to 500
    statement += ` LIMIT ${filters.limit}`;
  } else {
    statement += ` LIMIT 100`; // If no limit is supplied, use 100
  }

  try {
    connection.connect();
    const results = await connection.query(statement);
    connection.end(); // TODO fix conn pooling
    return results?.[0] || [];
  } catch (error) {
    console.log(error);
  }
}

export const storeEvent = async (event: Event) => {
  
  const connection = await getConnection();
  const query = 'INSERT INTO nostr_events (id, pubkey, created_at, kind, tags, content, sig, deleted) VALUES (?, ?)';
  const values = [
    event.id, 
    event.pubkey, 
    event.created_at, 
    event.kind, 
    event.tags, 
    event.content, 
    event.sig,
  ];

  try {
    connection.connect();
    const results = await connection.execute(query, values);
    connection.end(); // TODO fix conn pooling
    return results?.[0] || [];
  } catch (error) {
    console.log(error);
  }

}
