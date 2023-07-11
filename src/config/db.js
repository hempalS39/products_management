const mongoose = require('mongoose');

require('dotenv').config();
const {MONGO_URL} = process.env;

const connectDb = async function () {

    await mongoose.connect(MONGO_URL ,{
        useNewUrlParser : true
    })

    console.log("mongodb connected")
};

module.exports.connectDb = connectDb;
