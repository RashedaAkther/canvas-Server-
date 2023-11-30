const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

// const verifyToken = (req, res, next) => {
//   const token = req?.cookies?.token;
//   console.log(token);

//   if (!token) {
//       return res.status(401).send({ message: 'unauthorized access' })
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//       if (err) {
//         console.log(err);
//           return res.status(401).send({ message: 'unauthorized access' })
//       }
//       req.user = decoded;
//       console.log(req.user);
//       next();
//   })
// }

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    // return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return;
      // return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.xrrjj6y.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const UserCollection = client.db("RealState").collection("Users");
    const ReviewsCollection = client.db("RealState").collection("reviews");
    const UsersPropertyCollection = client
      .db("RealState")
      .collection("UsersProperty");

    const verifyAdmin = async (req, res, next) => {
      const email = req?.user?.email;
      console.log("admin ", email);
      const query = { email: email };
      const user = await UserCollection.findOne(query);
      console.log(user);
      const isAdmin = user?.role === "admin";
      console.log(isAdmin, "isadmin ni re");
      if (isAdmin) {
        console.log("fbhjhsdfgha");

        next();
        // return res.status(403).send({ message: "forbidden access" });
      }
    };
    const verifyAgent = async (req, res, next) => {
      const email = req?.user?.email;
      console.log("admin ", email);
      const query = { email: email };
      const user = await UserCollection.findOne(query);
      console.log(user);
      const isAdmin = user?.role === "Agent";
      console.log(isAdmin, "isadmin ni re");
      if (isAdmin) {
        console.log("fbhjhsdfgha");

        next();
        // return res.status(403).send({ message: "forbidden access" });
      }
    };

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    app.post("/users", async (req, res) => {
      const User = req.body;
      console.log(User);
      const query = { email: User?.email };
      console.log("auth user", User, query);
      const Exitinguser = await UserCollection.findOne(query);
      if (Exitinguser) {
        console.log("user ase");
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await UserCollection.insertOne(User);
      console.log(result);
      return res.send(result);
    });
    app.post("/addProperty/:email", verifyToken, async (req, res) => {
      const User = req.body;
      console.log(User);
      const email = req?.params?.email;
      const query = { email: email };
      const role = "Agent";
      const agentuser = await UserCollection.findOne(query);
    

      // Update user role to "Agent" if not already
      if (agentuser.role !== role) {
        await UserCollection.updateOne(query, { $set: { role: role } });
      }
  
      // Access the properties collection


      const result = await UsersPropertyCollection.insertOne(User);
      console.log(result);
      return res.send(result);
    });
    app.get("/Users", verifyToken, verifyAdmin, async (req, res) => {
      console.log("cheack to token", req?.user?.email);
      // console.log(req.user);
      const result = await UserCollection.find().toArray();
      // console.log(result);
      res.send(result);
    });
    app.get("/AdminProperties", verifyToken, verifyAdmin, async (req, res) => {
      // console.log(req.user);
      const result = await UsersPropertyCollection.find().toArray();
      // console.log(result);
      res.send(result);
    });
    app.get("/AdminReviews", verifyToken, verifyAdmin, async (req, res) => {
      // console.log(req.user);
      const result = await ReviewsCollection.find().toArray();
      // console.log(result);
      res.send(result);
    });
    app.get("/AgentProperties/:email", verifyToken, async (req, res) => {
      const email = req?.params.email;
  
      const query = { email: email };

      // console.log(req.user);
      const result = await UsersPropertyCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });

    app.get("/manageReviews", verifyToken, verifyAdmin, async (req, res) => {
      console.log("cheack to token", req?.user?.email);
      // console.log(req.user);
      const result = await ReviewsCollection.find().toArray();
      // console.log(result);
      res.send(result);
    });
    app.get("/Properties", verifyToken, verifyAdmin, async (req, res) => {
      // console.log("cheack to token", req?.user?.email);
      // console.log(req.user);
      const result = await ReviewsCollection.find().toArray();
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
        console.log(isAdmin, "admin");
      }
      res.send({ isAdmin });
    });
    app.get("/Agent/:email", verifyToken, verifyAgent, async (req, res) => {
      console.log("asoe hlit hocche", req?.user?.email);
      const email = req.params.email;

      console.log(req?.user, "emaillllllll", email);
      if (email !== req?.user?.email) {
        console.log("provlem");
        return res.status(403).send({ message: "unauthorized Access" });
      }
      const query = { email: email };
      const user = await UserCollection.findOne(query);
      console.log("Agent request user", user?.role);
      let isAgent = false;
      if (user?.role === "Agent") {
        // isAgent = user?.role=='Agent'
        isAgent = true;
        console.log(isAgent, "Agent");
      }
      console.log("request last ");
      res.send({ isAgent });
    });
    app.patch("/admin/:id", async (req, res) => {
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

    // app.get("/admin-status", verifyToken, async (req, res) => {
    //   const users = await UserCollection.estimatedDocumentCount();
    //   // const menusItems = await MenuCollection.estimatedDocumentCount();
    //   // const orders = await paymentsCollection.estimatedDocumentCount();

    //   // const result = await paymentsCollection
    //   //   .aggregate([
    //   //     {
    //   //       $group: {
    //   //         _id: null,
    //   //         totalRevenue: {
    //   //           $sum: "$price",
    //   //         },
    //   //       },
    //   //     },
    //   //   ])
    //   //   .toArray();
    //   // // console.log(result[0]);
    //   // const revenue = result.length > 0 ? result[0].totalRevenue : 0;

    //   // const revenue = payments.reduce(
    //   //   (total, payment) => total + payment.price,
    //   //   0
    //   // );
    //   // const revenuePars = parseFloat(revenue.toFixed(2));
    //   console.log(users);
    //   // console.log(users, menusItems, orders, revenue);
    //   res.send({
    //     // orders,
    //     // menusItems,
    //     users,
    //     // revenue,
    //   });
    // });

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
    app.put(
      "/user-update-status",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const email = req?.query.email;
        const status = req?.body.status;
        console.log("", email);
        const filter = { email: email, status };

        const update = {
          $set: {
            status: status,
          },
        };
        const options = { upsert: false };

        const result = await UserCollection.updateOne(filter, update, options);
        console.log(result);
        res.send(result);
      }
    );

    app.delete("/User/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await UserCollection.deleteOne(query);
      console.log(result);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
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
