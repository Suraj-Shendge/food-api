const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const pool = new Pool({
 connectionString: process.env.DATABASE_URL,
 ssl: {
  rejectUnauthorized: false
 }
});

app.get("/search", async (req,res)=>{

 const q = req.query.q;

 try {

  const result = await pool.query(
   `SELECT *
    FROM foods
    WHERE product_name ILIKE $1
    LIMIT 20`,
   [`%${q}%`]
  );

  res.json(result.rows);

 } catch(err){
  res.status(500).json({error: err.message});
 }

});

app.get("/barcode/:code", async (req,res)=>{

 try {

  const result = await pool.query(
   `SELECT *
    FROM foods
    WHERE barcode=$1`,
   [req.params.code]
  );

  res.json(result.rows[0]);

 } catch(err){
  res.status(500).json({error: err.message});
 }

});

app.listen(5000,()=>{
 console.log("API running on port 5000");
});