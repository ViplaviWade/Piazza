const joi = require('joi')

const registervalidation = (data) => {
    const schemaValidation = joi.object ({
        username: joi.string().required().min(3).max(256),
        email: joi.string().required().min(6).max(256).email(),
        password: joi.string().min(6).max(1024)
    })
    return schemaValidation.validte(data)
}

module.exports.registervalidation = registervalidation