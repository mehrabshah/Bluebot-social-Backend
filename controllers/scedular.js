// postScheduler.js
const logPost = async (post) => {
  if (!post.isPosted) {
    setTimeout(async () => { 
    console.log(`Scheduled Post:`, post);
  }, 1000);
  }
};

// Schedule posts
const schedulePosts = async (Post) => {
  try {
    const currentDate = new Date();
    const scheduledPosts = await Post.find({ date: { $gt: currentDate } });
    scheduledPosts.forEach((post) => {
      const scheduledTime = new Date(post.date);
      const currentTime = currentDate;
      const timeRemaining = scheduledTime - currentTime;
      if (timeRemaining > 0) {
        setTimeout(async () => { 
          await logPost(post);
        await Post.updateOne({ _id: post._id }, { isPosted: true }); 
        }, timeRemaining);
      }
    });
  } catch (error) {
    console.error('Error scheduling posts:', error);
  }
};

module.exports = schedulePosts;
