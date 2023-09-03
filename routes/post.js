const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const multer = require('multer');
const path = require('path');

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
router.post('/createPost',upload.single('img'), postController.createPost);
router.post('/getPost/:id', postController.getPost);
router.get('/getAllPost/:id', postController.getAllPost);
router.get('/getAllPostAdmin', postController.getAllPostAdmin);
router.post('/deletePostById/:id', postController.deletePostById);
router.post('/deleteAllPostAdmin', postController.deleteAllPosts);
module.exports = router;
