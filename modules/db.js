import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host:     process.env.HOST,   
    port:     process.env.DB_PORT,
    database: process.env.DB_DATABASE
});

const poolnewdb = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.HOST,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT,
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

// create table "items"
pool.query(
  `CREATE TABLE IF NOT EXISTS "items" (
	    "chatid"      VARCHAR(20) NOT NULL,
	    "arrayfordel" VARCHAR(200),
	    PRIMARY KEY ("chatid")
     )`,
  (err, res) => {
    if (err) {
      console.log(err.stack);
      throw err;
    } else {
      console.log("success create table 'items'");
    }
  }
);

// FUNCTION getlast
const getlast = async (userid) => {
  //console.log(userid)
  const query = `SELECT * from items where chatid = '${userid.toString()}'`;
  //console.log(query)  
  
  const client = await pool.connect();
  try {
    const res = await client.query(query);
    return res.rowCount ? res.rows[0].arrayfordel.split(',') : [];
  } catch (err) {
    console.log(err.stack);
  } finally {
    client.release();
  }
};

// FUNCTION clearlast
const clearlast = async (userid) => {
  const query = `UPDATE items set arrayfordel = '' where chatid = '${userid.toString()}'`;
  const client = await pool.connect();
  try {
    const res = await client.query(query);
    return res.rowCount ? res.rows : '';
  } catch (err) {
    console.log(err.stack);
  } finally {
    client.release();
  }
};

// FUNCTION savelast
const savelast = async (userid, arrayfordel, message_id) => {

   arrayfordel.push(message_id)
  
  const query = `INSERT INTO items (chatid, arrayfordel)
                 VALUES ('${userid.toString()}', '${arrayfordel.toString()}')
                 ON CONFLICT (chatid) DO UPDATE  SET arrayfordel = '${arrayfordel.toString()}';`;
  const client = await pool.connect();
  try {
    const res = await client.query(query);
    return res.rowCount ? res.rows : '';
  } catch (err) {
    console.log(err.stack);
  } finally {
    client.release();
  }
};

pool.connect() // вроде работает и без него

export {pool, getlast, savelast, clearlast};