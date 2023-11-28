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

router.get('/getAllPosts', async (req, res) => {
    try {
        console.log(".......................................................")
        const posts = await Post.find()
        console.log("Posts are : ", posts)
        res.send(posts)
    } catch (err) {
        res.status(400).send({message: err})
    }
})

router.put('/updatePost', async (req, res) => {
    const {postId} = req.query()
    const {postTitle, postTopic, message} = req.body
    const loggedUser = req.user.username;

    try {
        const postExists = await Post.findOne({post_id: postId})

        if(!postExists) {
            res.status(401).json({error: "Post not found"})
        }

        // if(postExists.posstOwner != loggedUser) {

        // }
    }
    catch {

    }
})

module.exports = router