const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173","https://canvas-property-project.netlify.app"],
    credentials: true,
  })
);
app.use(cookieParser());

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
    const ReviewsCollection = client.db("RealState").collection("Reviews");
    const WhistListCollection = client.db("RealState").collection("Whislist");
    const OfferCollection = client.db("RealState").collection("Offer");
    const UsersPropertyCollection = client
      .db("RealState")
      .collection("UsersProperty");
    const AgentSoldPropertyCollection = client
      .db("RealState")
      .collection("SoldProperty");

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
      const result = await UsersPropertyCollection.insertOne(User);
      console.log(result);
      return res.send(result);
    });

    app.post("/AddWhistList", verifyToken, async (req, res) => {
      const body = req.body;
      console.log(body);
      const result = await WhistListCollection.insertOne(body);
      console.log(result);
      res.send(result);
    });
    app.post("/AddOffer", verifyToken, async (req, res) => {
      const body = req.body;
      console.log(body);
      const result = await OfferCollection.insertOne(body);
      console.log(result);
      res.send(result);
    });
    app.post("/AddReview", verifyToken, async (req, res) => {
      const body = req.body;

      console.log(body);
      const result = await ReviewsCollection.insertOne(body);
      console.log(result);
      res.send(result);
    });


    app.post("/Property/click/:id", async (req, res) => {

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedProperty = await UsersPropertyCollection.findOneAndUpdate(
        filter,
        { $inc: { clickCount: 1 } },
        { returnDocument: 'after' }
      );
      console.log(id,filter,updatedProperty);
      res.send(updatedProperty);
    });
    app.get("/myReviews/:email", async (req, res) => {
      const email = req?.params?.email;
      const query = { email: email };
      const result = await ReviewsCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });
    app.get("/SingleReviews/:id", async (req, res) => {
      const id = req?.params?.id;
      console.log("id", id);
      const query = { propertyId: id };
      const result = await ReviewsCollection.find(query).toArray();
      // console.log(result, query, id);
      res.send(result);
    });

    app.get("/UserWhistList/:email", async (req, res) => {
      const email = req?.params?.email;
      const query = { UserEmail: email };
      const result = await WhistListCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });
    app.get("/Users", verifyToken, verifyAdmin, async (req, res) => {
      console.log("cheack to token", req?.user?.email);
      // console.log(req.user);
      const result = await UserCollection.find().toArray();
      // console.log(result);
      res.send(result);
    });
    app.get("/AdminProperties", verifyToken, async (req, res) => {
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

      console.log(email, query);
      const result = await UsersPropertyCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });
    app.get(
      "/AgentSoldProperties/:email",
      verifyToken,
      verifyAgent,
      async (req, res) => {
        const email = req?.params.email;

        const query = {
          agentemail: email,

          property_status: "sold",
        };

        console.log(email, query);
        const result = await OfferCollection.find(query).toArray();
        console.log(result);
        res.send(result);
      }
    );

    app.get("/manageReviews", verifyToken, verifyAdmin, async (req, res) => {
      console.log("cheack to token", req?.user?.email);
      // console.log(req.user);
      const result = await ReviewsCollection.find().toArray();
      // console.log(result);
      res.send(result);
    });

    app.get("/ALlProperties/:id", async (req, res) => {
      const id = req?.params?.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await UsersPropertyCollection.findOne(query);
      console.log(id, query);

      res.send(result);
    });
    app.get(
      "/RequestOffer/:email",
      verifyToken,
      verifyAgent,
      async (req, res) => {
        const email = req?.params?.email;
        const query = { agentemail: email };
        const result = await OfferCollection.find(query).toArray();
        console.log(query);
        res.send(result);
      }
    );
    app.get("/UserRequestOffer/:email", verifyToken, async (req, res) => {
      const email = req?.params?.email;
      const query = { buyerEmail: email };
      const result = await OfferCollection.find(query).toArray();
      console.log(query, email);
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
    app.put(
      "/propertyStatus/:id",
      verifyToken,
      verifyAdmin,

      async (req, res) => {
        const id = req?.params.id;
        const status = req?.body.property_status;
        console.log("", id, status);
        const filter = { _id: new ObjectId(id) };

        const update = {
          $set: {
            property_status: status,
          },
        };
        const options = { upsert: true };

        const result = await UsersPropertyCollection.updateOne(
          filter,
          update,
          options
        );
        console.log(result);
        res.send(result);
      }
    );
    app.put(
      "/agentProperty",
      verifyToken,

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

    app.put(
      "/statusChange/:id",
      verifyToken,

      async (req, res) => {
        console.log("arrman");
        const id = req?.params.id;
        const status = req?.body.status;
        const filter = { _id: new ObjectId(id) };

        const update = {
          $set: {
            status: status,
          },
        };
        console.log("", id, filter, update, status);
        const options = { upsert: true };

        const result = await OfferCollection.updateOne(filter, update, options);
        console.log(result);
        res.send(result);
      }
    );

    app.delete("/User/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await UserCollection.deleteOne(query);
      console.log(result);
      res.send(result);
    });
    app.delete("/review/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(id, "idddd");
      const query = { _id: new ObjectId(id) };
      const result = await ReviewsCollection.deleteOne(query);
      console.log(result);
      res.send(result);
    });
    app.delete("/WhistList/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await WhistListCollection.deleteOne(query);
      console.log(result);
      res.send(result);
    });
    app.delete(
      "/agentProperty/:id",
      verifyToken,
      verifyAgent,
      async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const query = { _id: new ObjectId(id) };
        const result = await UsersPropertyCollection.deleteOne(query);
        console.log(result);
        res.send(result);
      }
    );
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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
