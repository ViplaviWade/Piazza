const express = require('express')
router = express.Router()

const User = require('../models/user')
const { registerValidation, loginValidation } = require('../validations/validation')

const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

router.post('/register', async (req, res) => {

    // Validation for user details
    const { error } = registerValidation(req.body)
    if (error) {
        return res.send({message: error['details'][0]['message']})
    }

    // Check if user already exists
    const userExists = await User.findOne({email: req.body.email})
    if (userExists) {
        res.status(400).send({message: "User already exists."})
    }
    
    // genSalt() determines the cost factor of hashing algorithm
    // Higher cost results in a more secure hashes and take more time to compute
    // In bcrypt cost factor is an exponent of 2 so cost factor of 5 means
    // 2^5 rounds of hashing will be performed
    const salt = await bcryptjs.genSalt(5)
    const hashedPassword = await bcryptjs.hash(req.body.password, salt)


    // Insert new record
    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword
        // password: req.body.password
    })
    try {
        const savedUser = await user.save()
        res.send(savedUser)
    } catch (err) {
        res.status(400).send({message: err})
    }
    
    // res.send(registerValidation(req.body))
})

router.post('/login', async (req, res) => {

    const { error } = loginValidation(req.body)
    if (error) {
        return res.status(400).send({message: error['details'][0]['message']})
    }

    //Check if user exists
    const user = await User.findOne({email: req.body.email})
    if (!user) {
        return res.status(400).send({message: "User does not exist"})
    }

    //Check user password
    const passwordValidation = await bcryptjs.compare(req.body.password.trim(), user.password.trim())
    console.log("Request Body Password : ", req.body.password)
    console.log("Database User Password : ", user.password)
    console.log(passwordValidation)
    if (!passwordValidation) {
        return res.status(400).send({message: "Incorrect password"})
    }
    res.send("Login Successful")

    //Generate an authentication token
    const token = jwt.sign({_id: user.id}, process.env.TOKEN_SECRET)
    res.header('auth-token', token).send({'auth-token':token})
    return
})

module.exports = router

