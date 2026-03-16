const NodeCache = require("node-cache");
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const cache = new NodeCache({ stdTTL: 600 });

const pool = new Pool({
 connectionString: process.env.DATABASE_URL,
 ssl: {
  rejectUnauthorized: false
 }
});

app.get("/search", async (req,res)=>{

 const q = req.query.q;

 if(!q){
  return res.json([]);
 }

 const cacheKey = `search_${q.toLowerCase()}`;

 const cached = cache.get(cacheKey);

 if(cached){
  console.log("CACHE HIT");
  return res.json(cached);
 }

 try {

  const result = await pool.query(
  `SELECT *,
   COALESCE(ts_rank(search_vector, plainto_tsquery($1)),0) +
   similarity(product_name,$1) AS rank
   FROM foods
   WHERE search_vector @@ plainto_tsquery($1)
   OR product_name % $1
   ORDER BY rank DESC
   LIMIT 20`,
  [q]
  );

  cache.set(cacheKey,result.rows);

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
 console.log("API running on port", PORT);
});
