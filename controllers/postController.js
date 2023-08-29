    const dotenv = require('dotenv')
    dotenv.config()
    const Post = require('../models/post');
const { default: mongoose } = require('mongoose');


    async function createPost(req, res) {
        try {
          const postData = req.body; // Assuming you're sending post data in the request body
          const newPost = await Post.create(postData);
          return res.status(201).json(newPost);
        } catch (error) {
          return res.status(500).json({ error: 'An error occurred while creating the post.' });
        }
      }
      

    async function getPost(req, res) {
        try {
            const id = req.params.id; // Assuming you're sending the post ID as a URL parameter

          const post = await Post.findById(id);
          
          if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
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
      


    module.exports = {
        createPost,
        getPost,
        getAllPost
    };
