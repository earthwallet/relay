/**
 * Create Initial Database Schemas
 */

exports.up = function (knex) {
    return knex.raw(`
        CREATE TABLE IF NOT EXISTS chaintip (
            height NUMERIC(20, 0)
        );
        INSERT INTO chaintip (height) VALUES (0);

        CREATE TABLE IF NOT EXISTS nostr_events (
            id varchar(64) UNIQUE,
            pubkey varchar(64),
            created_at timestamp without time zone,
            kind int,
            tags text,
            content text,
            sig varchar(128),
            deleted boolean DEFAULT false,
            PRIMARY KEY (id, pubkey)
        );
        
        CREATE TABLE IF NOT EXISTS bitcoin_events (
            network varchar(64),
            bpubkey varchar(64),
            block_height int,
            txid varchar(64),
            content varchar(64) UNIQUE,
            npub varchar(64),
            type varchar(64),
            PRIMARY KEY (txid)
        );
        
        CREATE TABLE IF NOT EXISTS ethereum_events (
            network int,
            epubkey varchar(64),
            block_height int,
            txid varchar(64),
            content varchar(64),
            npub varchar(64),
            PRIMARY KEY (author)
        );
    `)
  }
  
  exports.down = function (knex) {
    return knex.raw(`
        DROP TABLE IF EXISTS ethereum_events;
        DROP TABLE IF EXISTS bitcoin_events;
        DROP TABLE IF EXISTS social_events;
        DROP TABLE IF EXISTS index_events;
    `)
  }