const express = require('express');
const app = express();
const route = require('./routes/route');
const multer = require('multer');

require('dotenv').config();
const {PORT} = process.env;

app.use(express.json());
app.use(express.urlencoded({extended : true}));

const {connectDb} = require('./config/db');
connectDb();

app.use(multer().any());
app.use('/' , route);

app.listen(PORT , function(){
    console.log(`express app running on port ${PORT}`)
})

