const Token = require("../models/token");
const { createLinkedInPost } = require("./linkedinController");
const {getToken, getFBID, postFacebook} = require("./facebookController");
// postScheduler.js
const logPost = async (post) => {
  if (!post.isPosted) {
    setTimeout(async () => { 
    // console.log(`Scheduled Post:`, post);
    if (post.type === "LINKEDIN") {
      console.log("linkedin");
      console.log(post);
      try {
        const token = await Token.findOne({ type: 'LINKEDIN', user: post.user });
        if (token) {
          const linkedinAccessToken = token.token;
          await createLinkedInPost({ postData: post, linkedinAccessToken });
        } else {
          console.log("LinkedIn token not found for the user.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    } 
    if(post.type === "FACEBOOK"){
    //  console.log("facebook");
    //  console.log(post);
      try{
        console.log(post.user);
        const token  = await getToken({ body: { user: post.userId } });
        await postFacebook({ body: { token: token, text : post.text1 } });
       // await getFBID({ body: { userId: post.userId } });
       // console.log(response);
      }catch (error) {
        console.error("Error:", error);
      }
    }
    
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
