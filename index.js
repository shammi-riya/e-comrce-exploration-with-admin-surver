const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();


app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;






const uri = `mongodb+srv://${process.env.collectionName}:${process.env.password}@cluster0.f4myxpg.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});





function verifyJWT(req, res, next) {
    const authorization = req.headers.authorization;
    console.log(authorization);
    if (!authorization) {
      return res.status(401).send({ error: "Unauthorized access!" });
    }
    const token = authorization.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      console.log({ err });
      if (err) {
        return res.status(403).send({ error: "Unauthorized access!" });
      }
      req.decoded = decoded;
      next();
    });
  }






async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection

        const ProductsCollection = client.db('Easy-Bazaar').collection("products");
        const cartCollection = client.db('Easy-Bazaar').collection('carts');
        const userCollection = client.db('Easy-Bazaar').collection('users');



       app.post('/jwt', (req, res) => {
    const body = req.body;
    if (body.email) {
        const token = jwt.sign({ email: body.email }, process.env.access_token_secret, { expiresIn: '30d' }); // Set expiration to 1 month (30 days)
        console.log(token);
        res.send({ token });
    } else {
        res.status(400).send('Email is required');
    }
});




        // products

        app.get("/products", async (req, res) => {
            const result = await ProductsCollection.find().toArray();
            res.send(result)
        })


        app.post('/add-cart',verifyJWT, async (req, res) => {
            const productsInfo = req.body;
            const result = await cartCollection.insertOne(productsInfo);
            res.send(result)

        })

        app.get('/my-cart',verifyJWT, async (req, res) => {
            const email = req.query.email;
            const quiry = { email: email };
            const result = await cartCollection.find(quiry).toArray();
            res.send(result)
        })








        app.delete('/delete-cart/:id', async (req, res) => {
            const id = req.params.id;


            const filter = { _id: new ObjectId(id) };

            try {
                const result = await cartCollection.deleteOne(filter);
                res.send(result);
            } catch (error) {
                console.error("Error deleting item:", error);
                res.status(500).send("Error deleting item");
            }
        });


        app.post("/post-product", async (req, res) => {
            const body = req.body;
            const result = await ProductsCollection.insertOne(body);
            res.send(result)
        })

        app.get('/product-list', async (req, res) => {
            const email = req.query.email;
            console.log(email);

            const quiry = { email: email };
            const result = await ProductsCollection.find(quiry).toArray();

            res.send(result)

        })





        // user
        app.put('/save-user/:email', async (req, res) => {

            const email = req.query.email;
            const user = req.body;
            const quiry = { email: email };
            const options = { upsert: true };

            const updateDoc = {
                $set: user
            }

            const result = await userCollection.updateOne(quiry, updateDoc, options);
            res.send(result);

        })

        app.get('/all-user', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })








        // dashbord

        app.get("/admin-stutus", async (req, res) => {
            const userCount = await userCollection.estimatedDocumentCount();
            const productCount = await ProductsCollection.estimatedDocumentCount();

            res.send({ userCount, productCount })
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('e-comrce running')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})