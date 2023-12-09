const express = require('express')
router = express.Router()
const shortid=require('shortid')

const User = require('../models/user')
const Post = require('../models/post')
const verifyToken = require('../verifyToken')
const post = require('../models/post')


router.post('/createPost', verifyToken, async (req, res) => {

    const currentTime = Date.now();
    const expiration_time = req.body.expiration_time;
    const expirationTimeInMilliseconds = currentTime + expiration_time * 60 * 1000;

    const newPost = new Post ({
        post_id:shortid.generate(),
        post_title: req.body.post_title,
        post_topic: req.body.post_topic,
        message: req.body.message,
        status: 'LIVE',
        likes_count: 0,
        dislikes_count: 0,
        comments_count: 0,
        postOwner: req.user.username,
        expiration_time: new Date(expirationTimeInMilliseconds)
    })
    
    try {
        const savedRecord = await newPost.save()
        res.json(savedRecord)
    } catch (error) {
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
        }
        
        if (userAlreadyPerformedAction) {
            return res.status(400).json({ message: `User has already ${action === 'like' ? 'liked' : 'disliked'} the post` });
        }

        res.json({ message: `User has ${action === 'like' ? 'liked' : 'disliked'} the post` });
        if (userAlreadyPerformedAction) {
            return res.status(400).json({ error: `User has already ${action === 'like' ? 'liked' : 'disliked'} the post` });
        }
        
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

    const {topic} = req.query

    try {
        const postExists = await Post.aggregate([
            { $match: { post_topic: topic } },
            {
                $addFields: {
                    totalInteractions: { $add: ['$likes_count', '$dislikes_count'] },
                },
            },
            { $sort: { totalInteractions: -1 } },
            { $limit: 1 },
        ]);
        
        if (!postExists || postExists.length === 0) {
            return res.status(404).json({error: `No active posts found for the topic: ${topic}`})
        }
      
        res.json(postExists[0]);
      } catch (err) {
        res.status(500).json({ error: err });
    }
})

router.get('/getPostPerTopic', verifyToken, async (req, res) => {

    const {topic} = req.query

    try {
        const postExists = await Post.find({post_topic: topic})
        console.log(postExists)
        if(!postExists) {
            return res.status(404).json({error: "Post not found"})
        }

        res.send(postExists)
    } catch(error) {
        res.status(400).send({message: error})
    }
})

router.get('/getExpiredPosts',verifyToken, async (req, res)=>{

    const { topic } = req.query;
    const currentTime = Date.now();

    try {
        const postExists = await Post.find({
            post_topic: topic,
            expiration_time: { $lt: currentTime }
        }).sort({ timestamp: -1}).exec();

        if (!postExists || postExists.length === 0) {
            return res.status(404).json({ error: `No expired posts found for the topic: ${topic}` });
        }

        res.send(postExists)

    } catch (error) {
        res.status(500).json({error: "Internal server error"})
    }
})

router.get('/getAllPosts', verifyToken, async (req, res) => {

    try {
        const posts = await Post.find()
        console.log("Posts are : ", posts)
        res.send(posts)
    } catch (err) {
        res.status(400).send({message: err})
    }
})

module.exports = router