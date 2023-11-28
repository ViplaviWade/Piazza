const jwt = require('jsonwebtoken')

const User = require('./models/user')

async function auth(req, res, next) {
    const token = req.header('auth-token')
    // const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send({message: "Access denied."})
    }
    // try {
    //     // Verify the token
    //     const verified = jwt.verify(token, process.env.TOKEN_SECRET)
    //     req.user = verified
    //     next()
    // } catch {
    //     return res.status(401).send({message: "Invalid token."})
    // }
    try {
    
        const verifiedToken = jwt.verify(token, process.env.TOKEN_SECRET)
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", verifiedToken)

        const user = await User.findById(verifiedToken._id)
        console.log("=============================================", user)

        // req.user = verifiedToken
        // console.log(".............................................", req.user)

        if(!user) {
            return res.status(401).json({ error: "Unauthorized. Invalid User"})
        }

        // const isPasswordValid = user.password.trim() === verifiedToken.password.trim();

        // if(!isPasswordValid) {
        //     return res
        //     .status(401)
        //     .json({error: "Unauthorized. Password is Invalid"})
        // }

        req.user = {
            _id: user._id,
            username: user.username
        }
        console.log("Request user is : ", req.user)

        next()

    } catch {
        res.status(401).json({error: "Unauthorized. Invalid token"})
    }
}

module.exports = auth