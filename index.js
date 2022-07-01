const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000;


//internal export 
const { notFoundHandeler, errorHandeler } = require('./middleware/errorHandeler')


app.use(cors())
app.use(express.json())



//all user access token verify
const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized Access' });

    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
};

//connect mongo db

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9x7m2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const userCollection = client.db("power-hack").collection("user");
        const billCollection = client.db("power-hack").collection("bill");
        const saltRounds = 10;


        const verifyUser = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.email === requester) {
                next();
            } else {
                res.status(403).send({ message: 'forbidden' });
            }
        };



        app.post('/registration', async (req, res) => {
            const userInfo = req.body;
            const hashedPwd = await bcrypt.hash(userInfo.password, saltRounds);
            const user = {
                name: userInfo.name,
                email: userInfo.email,
                password: hashedPwd
            }
            const result = await userCollection.insertOne(user);
            res.send(result)
        });

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await userCollection.findOne(filter);
            if (result) {
                const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '30d' });
                res.send({ result, token });
            }
            else {
                res.send({ result, token: false })
            }
        });
        app.get('/user/auth/me', verifyJwt, async (req, res) => {
            const email = req.decoded.email;
            const filter = { email: email };
            const data = await userCollection.findOne(filter);
            res.send(data)
        });

        app.post('/login', async (req, res) => {
            const email = req.body.email;
            console.log(email)
            const filter = { email: email };
            const user = await userCollection.findOne(filter);

            if (user) {
                const cmp = await bcrypt.compare(req.body.password, user.password);

                if (cmp) {
                    const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '30d' });
                    res.send({ user, token });
                }
                else {
                    res.send({ token: false, message: "Wrong username or password." });
                }
            }
            else {
                res.send({ token: false, message: "Wrong username or password." });
            }
        });


        app.post('/add-billing', verifyJwt, async (req, res) => {
            const bill = req.body;
            const result = await billCollection.insertOne(bill);
            res.send(result);

        });
        app.get('/billing-list', verifyJwt, async (req, res) => {
            const pages = req.query.page;
            const search = req.query.name;
            const query = {

                $or: [{
                    name: {
                        $regex: search.toString(), "$options": "i"
                    }
                }, {
                    email: {
                        $regex: search.toString(), "$options": "i"
                    }
                },
                {
                    phone: {
                        $regex: search.toString(), "$options": "i"
                    }
                }
                ]
            }

            const bills = await billCollection.find(query).skip(parseInt(pages) * 10).limit(10).toArray();
            res.send(bills);



        });

        app.get('/bill/count', verifyJwt, async (req, res) => {
            const bills = await billCollection.estimatedDocumentCount();
            res.send({ count: bills });
        });

        app.put('/update-billing/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const bill = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: bill,
            };
            const result = await billCollection.updateOne(query, updateDoc, options);
            res.send(result);
        });
        app.delete('/delete-billing/:id', verifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await billCollection.deleteOne(query);
            res.send(result);
        })






        //404 page
        app.use(notFoundHandeler);
        // error handling
        app.use(errorHandeler)
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