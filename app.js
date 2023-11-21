const express = require('express')
const app = express()

const mongoose = require('mongoose')
const bodyParser = require('body-parser')

require('dotenv/config')

mongoose.connect(process.env.DB_CONNECTOR, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error'));
db.once('open', () => {
    console.log('Database is connected!')
})

app.listen(3000, (req, res) => {
    console.log("Server is up and running!")
})

