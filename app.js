const express= require('express');
const cors = require('cors');
const mongoose = require('mongoose')

require('dotenv').config()
const app = express();
app.use(express.json())
app.use(cors());


const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);
const postRoutes = require('./routes/POST');
app.use('/post', postRoutes);

const cron = require('node-cron');

const port = process.env.SERVER_PORT;


app.get("/",(res,resp)=>{
    resp.send("Home page");
});
mongoose.connect('mongodb+srv://hassanshahzadvs:WvFkVLdzQ2GWJkBt@cluster0.mpfkmzl.mongodb.net/?retryWrites=true&w=majority')
.then(()=>app.listen(8000,()=>
console.log(`Connection ok`)))
.catch((err)=>console.log('error',err))
console.log("server running on port ",port)

