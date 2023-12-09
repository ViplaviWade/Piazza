const jwt = require('jsonwebtoken')

const User = require('./models/user')

async function auth(req, res, next) {

    const token = req.header('auth-token')

    if (!token) {
        return res.status(401).send({message: "Access denied."})
    }

    try {
    
        const verifiedToken = jwt.verify(token, process.env.TOKEN_SECRET)

        const user = await User.findById(verifiedToken._id)

        if(!user) {
            return res.status(401).json({ error: "Unauthorized. Invalid User"})
        }

        req.user = {
            _id: user._id,
            username: user.username
        }

        next()

    } catch {
        res.status(401).json({error: "Unauthorized. Invalid token"})
    }
}

module.exports = auth