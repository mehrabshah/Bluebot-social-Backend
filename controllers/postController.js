    const dotenv = require('dotenv')
    dotenv.config()
    const Post = require('../models/post');
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });
const schedule = require('node-schedule');
const {logPost} =require("./scedular")

    async function createPost(req, res) {
        try {
          const postData = req.body;
    
          if (req.file && fs.existsSync(req.file.path)) {
            postData.img = req.file.path;
          }
          const newPost = await Post.create(postData);
          const date = new Date(postData.date)
          const cronDate = `${date.getUTCMinutes()} ${date.getUTCHours()+5} ${date.getUTCDate()} ${date.getUTCMonth() + 1} *`;
    
          console.log(cronDate,"--------------------------")
          const job =  schedule.scheduleJob(cronDate, async() => {
        
            
            await logPost(newPost);
            await Post.updateOne({ _id: newPost._id }, { isPosted: true }); 
            console.log("scheduled post by API---------------",newPost)
            job.cancel()
      
          })
          return res.status(201).json(newPost);
        } catch (error) {
          console.log(error.data)
          return res.status(500).json({ error: 'An error occurred while creating the post.' });
        }
      }
      

    async function getPost(req, res) {
        try {
            const id = req.params.id;  
            console.log(id)
          const post = await Post.findById(id);
          
          if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
          }
          if (post.img && post.img.data) {
            res.contentType(post.img.contentType);
            return res.send(post.img.data);
          }
          return res.json(post);
        } catch (error) {
            console.log(error)
          return res.status(500).json({ error: 'An error occurred while fetching the post.' });
        }
      }
    async function getAllPost(req, res) {
        try {
            const userId = req.params.id; 

          const post = await Post.find({ user: userId });
          
          if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
          }
          
          return res.json(post);
        } catch (error) {
            console.log(error)
          return res.status(500).json({ error: 'An error occurred while fetching the post.' });
        }
      }
    async function getAllPostAdmin(req, res) {
        try {

          const post = await Post.find();
          
          if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
          }
          
          return res.json(post);
        } catch (error) {
            console.log(error)
          return res.status(500).json({ error: 'An error occurred while fetching the post.' });
        }
      }
      async function deleteAllPosts(req, res) {
        try {
          await Post.deleteMany({}); // This will delete all documents in the 'Post' collection
      
          return res.json({ message: 'All posts deleted successfully.' });
        } catch (error) {
          console.log(error);
          return res.status(500).json({ error: 'An error occurred while deleting all posts.' });
        }
      }

      async function deletePostById(req, res) {
        try {
          const postId = req.params.id; // Assuming you pass the post ID as a parameter in the URL
      
          const deletedPost = await Post.findByIdAndDelete(postId);
      
          if (!deletedPost) {
            return res.status(404).json({ error: 'Post not found.' });
          }
      
          return res.json({ message: 'Post deleted successfully.' });
        } catch (error) {
          console.log(error);
          return res.status(500).json({ error: 'An error occurred while deleting the post.' });
        }
      }

    module.exports = {
        createPost,
        getPost,
        getAllPost,
        getAllPostAdmin,
        deleteAllPosts,
        deletePostById
    };
