const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fname: {
        type : String,
        require : true
    },
    lname: {
        type : String,
        require : true
    },
    email: {
        type : String,
        require : true
    },//valid email, unique
    profileImage: {
        type : String,
        require : true
    }, // s3 link
    phone: {
        type : String,
        require : true,
        unique : true
    },//valid Indian mobile number 
    password: {
        type : String,
        require : true
    }, //minLen 8, maxLen 15 encrypted password
    address: {
      shipping: {
        street: {
            type : String,
            require : true
        },
        city: {
            type : String,
            require : true
        },
        pincode: {
            type : Number,
            require : true
        },
      },
      
      billing: {
        street: {
            type : String,
            require : true
        },
        city: {
            type : String,
            require : true
        },
        pincode: {
            type : Number,
            require : true
        },
      }
    }
},{timestamps : true});

module.exports = mongoose.model('User' , userSchema);

