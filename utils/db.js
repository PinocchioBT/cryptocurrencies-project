import * as pg from "pg";

const { Pool } = pg.default;

const pool = new Pool({
    connectionString: `postgres://`
})