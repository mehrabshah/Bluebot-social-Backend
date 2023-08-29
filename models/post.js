const mongoose = require('mongoose');

const PostsSchema = new mongoose.Schema({
  text1: { type: String, required: false },
  text2: { type: String, required: false },
  text3: { type: String, required: false, unique: false },
  img: {
    data: Buffer,
    contentType: String
  },
  date: { type: Date, required: false },
  type: { type: String, required: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Post = mongoose.model('Post', PostsSchema);
module.exports = Post;
