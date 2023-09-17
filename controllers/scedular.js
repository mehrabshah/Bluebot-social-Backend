const Token = require("../models/token");
const { createLinkedInPost,createLinkedInPostGlobal } = require("./linkedinController");
const {getToken, getFBID, postFacebook} = require("./facebookController");
// var cron = require("node-cron")
const LinkedinToken = require('../models/linkedinToken');
const schedule = require('node-schedule');


// postScheduler.js
const logPost = async (post) => {
  if (!post.isPosted) {
    // setTimeout(async () => { 
    // console.log(`Scheduled Post:`, post);
    if (post.type === "LINKEDIN") {
      console.log("linkedin");
      console.log(post);
      try {
        // const token = "AQWT9fvwq_2sHVzdngbS-I_u71d9VkMMn3pt0DiFNT2gpw8iXQCFo1NG97cy_Dia5fgU7tVfwjfUua96RjD3lFQL2oEl1Boo2qm3SSiDYQDmozlB9Q4EA3oh9iU7vbMmMUset_m7q40IrZ5XU139qeIXQY7LlFuZzCXvQQwJCzyOw0j7DxsHLk5M_Tkf23hQ8xnKyzHmS31Z9sYQqwkJA_mKiY2kKxkjLnOsI3TtUR4vuNHu3hAxrcA3zpp1RpTNx6iFH3D1GvaXgqDhcXVz00fYgrANRcm6iw47rDRbibjfWljZP8JumTxfcjXHvPVbLct-hHhhPOavlGBHqFMm7XK4FyWFQg"
        const token = await LinkedinToken.findOne({ userId: post.user });
        // const token = await LinkedinToken.findOne({ user: post.user });
        console.log(token,"TOKEN HERE")
        if (token) {
          const linkedinAccessToken = token.token;
          // const linkedinAccessToken ='AQWADAb1oy-eKCu_-3uSlpMLAV_UZ8aM3vIBbBU-Z6z91t4cHuOawgjuG34LEO8SqndVNUVVTYhQWz7GIbVxr5IW1G-X7xSccNlw1d3W4QtmpJUA5knb4-yYFoY_EI-APewDxoXnMd_M3UHLV9-ZAdrA0td_aX9-MU0odGesAEIA06ML82_XXdSPBuV0w92sxCD-J3ac5cykeAYXD-aUAzQVzijwtoH8Vr1PzxWPEQRFNG9VnUPnnwo_1KUUmhQkTvuoT3oLqR7jV8iJtw2jgKtDafyNenuXVjEnMdO5mEpAzScreS68tQKZWSMTYdCd8OOHqSWHzgGEv9Lldoex9LBPJtePJg'
          await createLinkedInPostGlobal({body:{ postData: post, linkedinAccessToken }});
        } else {
          console.log("LinkedIn token not found for the user.");
        }
      } catch (error) {
        console.error("Error:", error.data);
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
    
  // }, 1000);
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
const serverScheduler = async (Post) => {
  try {
    const currentDate = new Date();
    const scheduledPosts = await Post.find({ date: { $gt: currentDate } });
    scheduledPosts.forEach((post) => {
      console.log("---------------SCHEDULED POSTS ---------------")
      const date = new Date(post.date)
      const cronDate = `${date.getUTCMinutes()} ${date.getUTCHours()} ${date.getUTCDate()} ${date.getUTCMonth() + 1} *`;

    const job =  schedule.scheduleJob(cronDate, async() => {
        
        await logPost(post);
        await Post.updateOne({ _id: post._id }, { isPosted: true }); 
        console.log("running scheduled post",post)
        job.cancel()
  
      })

    });
  } catch (error) {
    console.error('Error scheduling posts:', error);
  }
};

module.exports = {schedulePosts,serverScheduler,logPost};
