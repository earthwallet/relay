// Update with your config settings.
module.exports = {
  testnet: {
    client: "mysql",
    connection: {
      host: process.env.DB_HOST ?? 'localhost',
      port: process.env.DB_PORT ?? 5432,
      user: process.env.DB_USER ?? 'username',
      password: process.env.DB_PASSWORD ?? 'password',
      database: process.env.DB_NAME ?? 'testnet',
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },
  mainnet: {
    client: "mysql",
    connection: process.env.DB_URI ? process.env.DB_URI : {
      host: process.env.DB_HOST ?? 'localhost',
      port: process.env.DB_PORT ?? 5432,
      user: process.env.DB_USER ?? 'username',
      password: process.env.DB_PASSWORD ?? 'password',
      database: process.env.DB_NAME ?? 'mainnet',
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }
};