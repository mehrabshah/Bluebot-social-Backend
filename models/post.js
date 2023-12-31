const mongoose = require('mongoose');

const PostsSchema = new mongoose.Schema({
  text: { type: String, required: false },
  text1: { type: String, required: false },
  text2: { type: String, required: false },
  text3: { type: String, required: false, unique: false },
  post: { type: String, required: false, unique: false },
  img: String,
  date: { type: Date, required: false },
  type: { type: String, required: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPosted:{type:Boolean,required:false}
});

const Post = mongoose.model('Post', PostsSchema);
module.exports = Post;
