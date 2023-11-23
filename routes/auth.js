const express = require('express')
router = express.Router()

const User = require('../models/user')

router.get('/', async (req, res) => {
    try {
        const users = await User.find()
        res.status(200).send(users)
    }
    catch (err) {
        res.status(400).send({ message: err })
    }
})

module.exports = router

