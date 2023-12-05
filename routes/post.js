const express = require('express')
router = express.Router()
const shortid=require('shortid')

const User = require('../models/user')
const Post = require('../models/post')
const verifyToken = require('../verifyToken')
const Comment=require('../models/comment')

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

router.put('/action', verifyToken, async (req, res) => {
    const {postId, action} = req.query
    const loggedUser = req.user.username;
    const commentBody=req.body.comment
    const currentTime = Date.now();

    try {
        const postExists = await Post.findOne({post_id: postId})
        console.log("Post exists...............")
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

        // if(action == 'like') {
        //     console.log("Action LIKE is performed")
        //     postExists.likes_count += 1
        // }

        // if(action =='dislike') {
        //     console.log("Action DISLIKE is performed")
        //     postExists.dislikes_count -= 1
        // }

        // if(action == 'comment') {
        //     console.log("Action Comment is performed.")
        //     const newComment= Comment({
        //         commentId:shortid.generate(),
        //         postId:postId,
        //         username:loggedUser,
        //         comment:commentBody
        //     })
        //     await newComment.save()
        // }

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

router.get('/mostActivePost', verifyToken, async (req, res)=> {
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

router.get('/messagePerTopic', verifyToken, async (req, res) => {
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

module.exports = router