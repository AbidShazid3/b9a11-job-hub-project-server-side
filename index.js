const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ltb0gzh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const jobsCollection = client.db('jobDB').collection('jobs');
        const jobsCustomerCollection = client.db('jobDB').collection('customer');

        // auth relate
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, cookieOptions).send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { ...cookieOptions, maxAge: 0}).send({ success: true })
        })

        // customer related
        app.get('/customer', async (req, res) => {
            const result = await jobsCustomerCollection.find().toArray();
            res.send(result);
        })


        // job related
        app.get('/jobs', async (req, res) => {
            const result = await jobsCollection.find().toArray();
            res.send(result);
        })

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query);
            res.send(result);
        })

        // my job related
        app.get('/myJob', async (req, res) => {
            
            let query = {};
            if (req.query?.email) {
                query = { userEmail: req.query.email }
            }
            const result = await jobsCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/jobs', async (req, res) => {
            const job = req.body;
            console.log(job);
            const result = await jobsCollection.insertOne(job);
            res.send(result);
        })

        app.put('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const option = { upsert: true }
            const updatedJob = req.body;
            const job = {
                $set: {
                    jobTitle: updatedJob.jobTitle,
                    jobCategory: updatedJob.jobCategory,
                    jobSalary: updatedJob.jobSalary,
                    jobDescription: updatedJob.jobDescription,
                    JobPostDate: updatedJob.JobPostDate,
                    jobDeadline: updatedJob.jobDeadline,
                    jobApplicants: updatedJob.jobApplicants,
                    photo: updatedJob.photo
                }
            }
            const result = await jobsCollection.updateOne(filter, job, option);
            res.send(result);
        })

        app.delete('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('job hub is running!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})