const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/createPost', postController.createPost);
router.post('/getPost/:id', postController.getPost);
router.get('/getAllPost/:id', postController.getAllPost);

module.exports = router;
