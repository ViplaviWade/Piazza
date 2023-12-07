const express = require('express')
router = express.Router()
const shortid=require('shortid')

const User = require('../models/user')
const Post = require('../models/post')
const Comment=require('../models/comment')
const verifyToken = require('../verifyToken')


router.post('/createPost', verifyToken, async (req, res) => {
    console.log(" Request User/ Username : ", req.user)
    const currentTime = Date.now();
    const expiration_time = req.body.expiration_time;
    const expirationTimeInMilliseconds = currentTime + expiration_time * 60 * 1000;
    const newPost = new Post ({
        post_id:shortid.generate(),
        post_title: req.body.post_title,
        post_topic: req.body.post_topic,
        message: req.body.message,
        status: 'LIVE',
        // req.body.status,
        likes_count: 0,
        // req.body.likes_count,
        dislikes_count: 0,
        // req.body.dislikes_count,
        comments_count: 0,
        // req.body.comments_count,
        postOwner: req.user.username,
        expiration_time: new Date(expirationTimeInMilliseconds)
        // req.user.expiration_time + (60*1000)
    })
    console.log(" The JSON data is : ", newPost)
    
    try {
        const savedRecord = await newPost.save()
        console.log("Post is saved...............")
        res.json(savedRecord)
    } catch (error) {
        console.log("There is error in saving the post......")
        // console.log(error)
        res.status(500).json({error: error.message})
    }
})

router.put('/updatePost', verifyToken,async (req, res) => {
    const {postId} = req.query
    const {postTitle, postTopic, message} = req.body
    const loggedUser = req.user.username;

    try {

        const postExists = await Post.findOne({post_id: postId})

        if(!postExists) {
            return res.status(404).json({error: "Post not found"})
        }
        // updatedPost = new Post({
        //     post_title: req.body.post_title,
        //     post_topic: req.body.post_topic,
        //     message: req.body.message,
        // })

        if(postExists.postOwner != loggedUser) {
            return res
            .status(403)
            .json({error: "Access Denied. You do not have the permission to modify this post"})
        }

        if(postExists.expiration_time < Date.now) {
            return res.status(403).json({error: "Post expired for update"})
        }

        postExists.title = postTitle || postExists.title
        postExists.post_topic = postTopic || postExists.post_topic
        postExists.message = message || postExists.message

        await postExists.save();
        res.status(200).json({message: "Post updated successfully."})
    }
    catch {
        console.error(error);
        res.status(500).json({ error: "Internal server error"})
    }
})

router.put('/performAction', verifyToken, async (req, res) => {
    const {postId, action} = req.query
    const loggedUser = req.user.username;
    const commentBody = req.body.comment
    const currentTime = Date.now();

    let updateQuery = {};
    let userAlreadyPerformedAction = false;

    try {
        const postExists = await Post.findOne({post_id: postId})

        if(!postExists) {
            return res.status(404).json({error: "Post not found"})
        }

        if(postExists.postOwner == loggedUser) {
            return res
            .status(403)
            .json({error: "Post owner cannot perform any action on post"})
        }

        if(postExists.expiration_time < currentTime) {
            
            console.log("Post is expired..............")
            return res.status(403).json({error: "Post expired for performing any action"})
        }
        
        if(action == 'like') {
            if (!postExists.like_users || !postExists.like_users.includes(loggedUser)) {
                await Post.findByIdAndUpdate(
                    postExists._id,
                    { $push: { like_users: loggedUser }, $inc: { likes_count: 1 } }
                );
            } else {
                userAlreadyPerformedAction = true;
            }
        }

        if(action =='dislike') {
            if (!postExists.dislike_users || !postExists.dislike_users.includes(loggedUser)) {
                await Post.findByIdAndUpdate(
                    postExists._id,
                    { $push: { dislike_users: loggedUser }, $inc: { dislikes_count: 1 } }
                );
            } else {
                userAlreadyPerformedAction = true;
            }
        }

        if(action == 'comment') {
            const newComment = {
                commentId: shortid.generate(),
                username: loggedUser,
                comment: commentBody
            }
            await Post.findByIdAndUpdate(
                postExists._id,
                {$push: {comments: newComment}, $inc: {comments_count: 1}}
            );
            return res.status(200).json({message: "Comment posted successfully."})
            // console.log("Action Comment is performed.")
            // const newComment= Comment({
            //     commentId:shortid.generate(),
            //     postId:postId,
            //     username:loggedUser,
            //     comment:commentBody
            // })
            // postExists.comments_count += 1
            // await newComment.save()
        }
        
        if (userAlreadyPerformedAction) {
            return res.status(400).json({ message: `User has already ${action === 'like' ? 'liked' : 'disliked'} the post` });
        }

        res.json({ message: `User has ${action === 'like' ? 'liked' : 'disliked'} the post` });
        if (userAlreadyPerformedAction) {
            return res.status(400).json({ error: `User has already ${action === 'like' ? 'liked' : 'disliked'} the post` });
        }
        // await postExists.save();
        // res.status(200).json({message: "Action performed successfully."})
        
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal server error."})
    }
})

router.get('/getpostById', verifyToken, async (req, res) => {
    const {postId} = req.query
    try {
        const postExists = await Post.findOne({post_id: postId})

        if(!postExists) {
            return res.status(404).json({error: "Post not found"})
        }
        res.send(postExists)
    } catch (error) {
        res.status(400).send({message: error})
    }
})

router.get('/getMostActivePost', verifyToken, async (req, res)=> {
    const {topic, action} = req.query

    try {
        let sortQuery; 
        if (action === 'likes') {
            sortQuery = { likes: -1 };
        } else if (action === 'dislikes') {
            sortQuery = { dislikes: -1 };
        } else {
          // Default to sorting by timestamp if action is neither 'likes' nor 'dislikes'
            sortQuery = { timestamp: -1 };
        }
      
        const postExists = await Post.findOne({ postTopic: topic })
            .sort({ ...sortQuery, timestamp: -1 }) // Add timestamp to ensure sorting by timestamp as a tiebreaker
            .exec();
      
        res.json(postExists);
      } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
})

router.get('/getPostPerTopic', verifyToken, async (req, res) => {
    const {topic} = req.query

    try {
        const postExists = await Post.find({post_topic: topic})

        if(!postExists) {
            return res.status(404).json({error: "Post not found"})
        }

        res.send(postExists)
    } catch(error) {
        res.status(400).send({message: error})
    }
})

router.get('/getExpiredPosts',verifyToken, async (req, res)=>{
    const currentTime = Date.now();

    try {
        const postExists = await Post.find({ expiration_time: { $lt: currentTime }})
        .sort({ timestamp: -1})
        .exec();

        console.log("Expired Posts are : ", postExists)

        // Update the status of posts as 'EXPIRED'
        await Post.updateMany(
            { _id: { $in: postExists.map(post => post._id) } },
            { $set: { status: 'EXPIRED' } }
        );

        res.send(postExists)

    } catch (error) {
        res.status(500).json({error: "Internal server error"})
    }
})

router.get('/getAllPosts', verifyToken, async (req, res) => {
    try {
        console.log(".......................................................")
        const posts = await Post.find()
        console.log("Posts are : ", posts)
        res.send(posts)
    } catch (err) {
        res.status(400).send({message: err})
    }
})

module.exports = router