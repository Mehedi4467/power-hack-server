const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors())
app.use(express.json())


//connect mongo db

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9x7m2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const userCollection = client.db("power-hack").collection("user");
    }
    finally {
        // await client.close(); 
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Power hack server is running")
})

app.listen(port, () => {
    console.log('server is running with port', port)
})