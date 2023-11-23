const express = require("express")
const app=express()

const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv/config')

app.use(bodyParser.json())

const cors=require("cors")
app.use(cors())


const authRoute = require('./routes/auth')
const postRoute = require('./routes/post')

mongoose.connect(process.env.DB_CONNECTOR)
const db = mongoose.connection;

app.get("/health",async(req,res)=>{
    console.log("===================================")
    res.send("test")
})

app.use('/api', postRoute)

db.on('error', console.error.bind(console, 'Connection error'));
db.once('open', () => {
    console.log('Database is connected!')
})


app.listen(3000, (req, res) => {
    console.log("Server is up and running!")
})

