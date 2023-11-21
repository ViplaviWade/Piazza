const express = require("express")
const app = express()

const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const authRouter=require('./routes/auth')

require('dotenv/config')

const cors=require("cors")

app.use(cors())

mongoose.connect(process.env.DB_CONNECTOR)
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error'));
db.once('open', () => {
    console.log('Database is connected!')
})

app.use("/health",(req,res)=>[
    console.log("here")
])

app.listen(3000, (req, res) => {
    console.log("Server is up and running!")
})

