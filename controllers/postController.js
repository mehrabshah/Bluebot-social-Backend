    const dotenv = require('dotenv')
    dotenv.config()
    const Post = require('../models/post');
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });


    async function createPost(req, res) {
        try {
          const postData = req.body;
    
          if (req.file && fs.existsSync(req.file.path)) {
            postData.img = req.file.path;
          }
          const newPost = await Post.create(postData);
          return res.status(201).json(newPost);
        } catch (error) {
          console.log(error)
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
      


    module.exports = {
        createPost,
        getPost,
        getAllPost,
        getAllPostAdmin
    };
