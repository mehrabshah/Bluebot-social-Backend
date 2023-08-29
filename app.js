const express= require('express');
const cors = require('cors');
const mongoose = require('mongoose')

require('dotenv').config()
const app = express();
const twitterAuthRoutes = require("./controllers/twitterController");
app.use(express.json())
app.use(cors());


const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);
app.use('/auth/twitter', twitterAuthRoutes);

const cron = require('node-cron');

const port = process.env.SERVER_PORT;


app.get("/",(res,resp)=>{
    resp.send("Home page");
});
mongoose.connect('mongodb+srv://shapito0786:shapito0786@cluster0.dedf7o1.mongodb.net/')
.then(()=>app.listen(8000,()=>
console.log(`Connection ok`)))
.catch((err)=>console.log('error',err))
console.log("server running on port ",port)

