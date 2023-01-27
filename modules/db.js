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
if (dbQuery.rows.length === 0) {// database does not exist, make it:
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
    //  console.log("success create table 'items'");
    }
  }
);

// create table "numbers"
pool.query(
  `CREATE TABLE IF NOT EXISTS "numbers" (
	    "chatid" VARCHAR(20) NOT NULL,
	    "number" INTEGER,
	    PRIMARY KEY ("chatid")
     )`,
  (err, res) => {
    if (err) {
      console.log(err.stack);
      throw err;
    } else {
    }
  }
);

// create table "history"
pool.query(
  `CREATE TABLE IF NOT EXISTS "history" (
      "chatid" VARCHAR(20) NOT NULL,
	    "date" TIMESTAMP NOT NULL DEFAULT NOW(),
	    "numberbot" INTEGER,
	    "numberuser" INTEGER,
	    "guess" BOOLEAN,               
	    PRIMARY KEY (chatid, date)
     )`,
  (err, res) => {
    if (err) {
      console.log(err.stack);
      throw err;
    } else {
    }
  }
);

// ************************************
// FUNCTIONS
// ************************************

// FUNCTION getnumberbot
const getnumberbot = async (userid) => {
  const query = `SELECT * from numbers where chatid = '${userid.toString()}'`;
  const client = await pool.connect();
  try {
       const res = await client.query(query);
       return res.rowCount ? res.rows[0].number : 999;
  } catch (err) {
       console.log(err.stack);
  } finally {
       client.release();
  }
};
// FUNCTION savehistory
const setnumberbot = async (userid, number) => {
 const query = `INSERT INTO numbers (chatid, number)
                 VALUES ('${userid.toString()}', ${number})
                 ON CONFLICT (chatid) DO UPDATE SET number = ${number};`;
  const client = await pool.connect();
  try {
       const res = await client.query(query);
       return true;
  } catch (err) {
       console.log(err.stack);
       return false
  } finally {
       client.release();
  }
};
// FUNCTION savehistory
const savehistory = async (userid, numberbot, numberuser) => {

  const query = `INSERT INTO history (chatid, numberbot, numberuser, guess)
                 VALUES ('${userid.toString()}', ${numberbot}, ${numberuser}, ${numberuser === numberbot ? true : false});`;
  const client = await pool.connect();
  try {
       const res = await client.query(query);
       return true;
  } catch (err) {
       console.log(err.stack);
       return false       
  } finally {
       client.release();
  }
};
// FUNCTION results
const gameresults = async (userid) => {
  const query = `SELECT SUM(guess) as guess, SUM(miss) as miss, SUM(guess + miss) as total FROM
          ((select COUNT(T1.date) as guess, 0 as miss FROM history T1 where T1.chatid = '${userid.toString()}' and T1.guess = true) 
          UNION ALL 
          (select 0, COUNT(T2.date)  from history T2 where T2.chatid = '${userid.toString()}' and T2.guess = false)) AS final;`;
  const client = await pool.connect();
  try {
       const res = await client.query(query);

       return res.rowCount ? (+res.rows[0].guess / +res.rows[0].total) : 0;
  } catch (err) {
       console.log(err.stack);
       return 0
  } finally {
       client.release();
  }
};





// FUNCTION getlast
const getlast = async (userid) => {
  const query = `SELECT * from items where chatid = '${userid.toString()}'`;
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

export {pool, getlast, savelast, clearlast, getnumberbot, setnumberbot, savehistory, gameresults};