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


const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log(token);
   
  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
          return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded;
      console.log(req.user);
      next();
  })
}

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
    const UserCollection = client.db("Blood-Source").collection("Users");

    app.post('/jwt',  async (req, res) => {
      const user = req.body;
      // console.log('user token');
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      // console.log('user for token', token,user);
    
      res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'
      })
          .send({ success: true });
    })
    app.post("/users", async (req, res) => {
      const User = req.body;
      console.log("auth user", User);
      const query = { email: User?.email };
      const Exitinguser = await UserCollection.findOne(query);
      if (Exitinguser) {
        console.log("user ase");
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await UserCollection.insertOne(User);
      console.log(result);
      return res.send(result);
    });
    app.get("/Users", verifyToken, async (req, res) => {
          console.log("cheack to token", req?.user?.email);
          // console.log(req.user);
          const result = await UserCollection.find().toArray();
          // console.log(result);
          res.send(result);
        });

    app.get("/admin/:email", verifyToken, verifyAdmin, async (req, res) => {
      console.log("asoe hlit hocche", req?.user?.email);
      const email = req.params.email;

      console.log(req?.user, "emaillllllll", email);
      if (email !== req?.user?.email) {
        console.log("provlem");
        return res.status(403).send({ message: "unauthorized Access" });
      }
      const query = { email: email };
      const user = await UserCollection.findOne(query);
      console.log("admin request user", user?.role);
      let isAdmin = false;
      if (user?.role === "admin") {
        // isAdmin = user?.role=='admin'
        isAdmin = true;
        console.log(isAdmin, "sadhdiowh");
      }
      res.send({ isAdmin });
    });
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const UpdatedUser = {
        $set: {
          role: "admin",
        },
      };
      const result = await UserCollection.updateOne(query, UpdatedUser);
      console.log(result);

      res.send(result);
    });
    app.put("/user-update", verifyToken, verifyAdmin, async (req, res) => {
      const email = req?.query.email;
      const role = req?.body.role;
      console.log("", email, role);
      const filter = { email: email };

      const update = {
        $set: {
          role: role,
        },
      };
      const options = { upsert: false };

      const result = await UserCollection.updateOne(filter, update, options);
      console.log(result);
      res.send(result);
    });

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

