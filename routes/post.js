const express = require('express')
router = express.Router()

const Post = require('../models/post')

router.post('/createPost', async (req, res) => {
    console.log(" Request Body Structure : ", req.body)
    const newPost = new Post ({
        post_title: req.body.post_title,
        post_topic: req.body.post_topic,
        message: req.body.message,
        status: req.body.status,
        likes_count: req.body.likes_count,
        dislikes_count: req.body.dislikes_count,
        comments_count: req.body.comments_count,
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

module.exports = router