import * as pg from "pg";

const { Pool } = pg.default;

const pool = new Pool({
    connectionString: `postgresql://postgres:54321@localhost:5432/cryptocurrencies`
})

export { pool }