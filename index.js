const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// const SSLCommerzPayment = require("sslcommerz-lts");
const port = process.env.PORT || 5000;
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(cookieParser());


const uri =`mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.xrrjj6y.mongodb.net/?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
  console.log(res.send("BISTRO BOSS SERVER SITE IS RUNNING"));
});
app.listen(port, () => {
  console.log(`server is running on this port ${port}`);
});

