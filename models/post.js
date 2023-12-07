const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
    post_title: {
        type: String,
        required: true
    },
    post_topic: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    expiration_time: {
        type: Date,
        // default: () => Date.now() + 5 * 60 * 1000,
        // type: Date.now()+5*60*1000,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    like_users: [{
        type: String
    }],
    likes_count: {
        type: Number,
        required: true
    },
    dislike_users: [{
        type: String
    }],
    dislikes_count: {
        type: Number,
        required: true
    },
    comments: [
        {
            commentId: { type: String, required: true },
            username: { type: String, required: true },
            comment: { type: String, required: true }
        }
    ],
    comments_count: {
        type: Number,
        required: true
    },
    post_id: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        // type: Date.now()+5*60*1000,
        // default: () => Date.now() + 5 * 60 * 1000,
        required: true
    },
    postOwner: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('post', postSchema)