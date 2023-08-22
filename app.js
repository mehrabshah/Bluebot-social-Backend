const express= require('express');
const cors = require('cors');

require('dotenv').config()
const app = express();
app.use(express.json())
app.use(cors());
require('./config/dbconnection')


const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const cron = require('node-cron');

const port = process.env.SERVER_PORT;


app.get("/",(res,resp)=>{
    resp.send("Home page");
});
console.log("server running on port ",port)

app.listen(port)