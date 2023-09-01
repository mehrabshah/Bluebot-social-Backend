const express= require('express');
const mongoose = require('mongoose')
const cron = require('node-cron');
require('dotenv').config()
const cors = require('cors');
const app = express();
const twitterAuthRoutes = require("./controllers/twitterController");
app.use(express.json())
app.use(cors());


const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);
app.use('/auth/twitter', twitterAuthRoutes);
const postRoutes = require('./routes/POST');
const schedulePosts = require('./controllers/scedular');
const Post = require('./models/post');
app.use('/post', postRoutes);

const port = process.env.SERVER_PORT;
app.get("/",(res,resp)=>{
    resp.send("Home page");
});
mongoose.connect('mongodb+srv://shapito0786:shapito0786@cluster0.dedf7o1.mongodb.net/')
.then(() => {
    cron.schedule('*/5 * * * * *', () => {
        schedulePosts(Post);
      console.log('Running scheduled task...');
    });
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => console.log('Error connecting to MongoDB:', err));
console.log("server running on port ",port)
