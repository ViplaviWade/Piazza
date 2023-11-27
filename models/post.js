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
        default: () => Date.now() + 5 * 60 * 1000,
        // type: Date.now()+5*60*1000,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    likes_count: {
        type: Number,
        required: true
    },
    dislikes_count: {
        type: Number,
        required: true
    },
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
    }
    // postowner: {
    //     type: String,
    //     required: true
    // }
})

module.exports = mongoose.model('post', postSchema)