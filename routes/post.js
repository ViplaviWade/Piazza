const express = require('express')
router = express.Router()
const shortid=require('shortid')

const User = require('../models/user')
const Post = require('../models/post')
const verifyToken = require('../verifyToken')

router.post('/createPost', verifyToken, async (req, res) => {
    console.log(" Request User/ Username : ", req.user)
    const newPost = new Post ({
        post_id:shortid.generate(),
        post_title: req.body.post_title,
        post_topic: req.body.post_topic,
        message: req.body.message,
        status: req.body.status,
        likes_count: req.body.likes_count,
        dislikes_count: req.body.dislikes_count,
        comments_count: req.body.comments_count,
        postOwner: req.user.username
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

module.exports = router