import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
    user: "postgres",
    password: "scolfowQeyHa21",
    host: "localhost",   
    port: "5432",
    database: "oilrb"
});

const poolnewdb = new Pool({
  user: process.env.DB_USER,
  host: process.env.HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
console.log(process.env.DB_DATABASE);
const dbQuery = await poolnewdb.query(
  `SELECT FROM pg_database WHERE datname = $1`,
  [process.env.DB_DATABASE]
);
if (dbQuery.rows.length === 0) {
  // database does not exist, make it:
  await poolnewdb.query(`CREATE DATABASE ${process.env.DB_DATABASE}`);
  console.log(`Database ${process.env.DB_DATABASE} created!`);
}

pool.connect() // вроде работает и без него

export default pool