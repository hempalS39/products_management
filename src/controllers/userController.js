const userModel = require('../models/userModel');
const {uploadFile} = require('../config/aws');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const mongoose = require('mongoose');
const {isValid,validateEmail,validateMobile} = require('../utils/validations');

const createUser = async function (req, res) {
    try {
        let data = req.body;
        let file = req.files;

        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "pls provide user details" });
        if (file.length == 0) return res.status(400).send({ status: false, message: "provide profileImage" });

        const { fname, lname, email, phone, password, address } = data;
        //check for mandatory fields
        if (!fname) return res.status(400).send({ status: false, message: "enter fname" });
        if (!lname) return res.status(400).send({ status: false, message: "enter lname" });
        if (!email) return res.status(400).send({ status: false, message: "enter email" });
        if (!phone) return res.status(400).send({ status: false, message: "enter phone" });
        if (!password) return res.status(400).send({ status: false, message: "enter password" });
        if (!address) return res.status(400).send({ status: false, message: "enter address" });
        // validation for mandatory fields         
        if (!isValid(fname)) return res.status(400).send({ status: false, message: "fname not valid" });
        if (!isValid(lname)) return res.status(400).send({ status: false, message: "lname not valid" });
        if (!isValid(email)) return res.status(400).send({ status: false, message: "email not valid" });
        if (!isValid(phone)) return res.status(400).send({ status: false, message: "phone not valid" });
        if (!isValid(password)) return res.status(400).send({ status: false, message: "password not valid" });
        if(password.length<8 || password.length>15) return res.status(400).send({ status: false, message: "password length should be form 8 - 15" });
        if (!validateEmail(email)) return res.status(400).send({ status: false, message: "Invalid email" });
        if (!validateMobile(phone)) return res.status(400).send({ status: false, message: "Invalid phone NUmber" });

        //for address
        let addressArray=Object.keys(address)
  
        // if(typeof data.address !="object") return res.status(400).send({status:false,msg:"address must be in object form"})
        if(!addressArray.includes("shipping"))return res.status(400).send({status:false,msg:"shipping address is required"})
        if(!addressArray.includes("billing"))return res.status(400).send({status:false,msg:"billing address is required"})
        
        //For required  fields of Address 
        let requiredFieldOfAddress=[ "street","city","pincode"]
        for (let j = 0; j < requiredFieldOfAddress.length; j++) {
            let shippingAddress = Object.keys(address.shipping)
            let billingAddress = Object.keys(address.billing)
                    
            if (!billingAddress.includes(requiredFieldOfAddress[j]))
                return res.status(400).send({ status: false, msg: 'Enter ' + requiredFieldOfAddress[j] +" in billing address" })
            if (!shippingAddress.includes(requiredFieldOfAddress[j]))
                return res.status(400).send({ status: false, msg: 'Enter ' + requiredFieldOfAddress[j] +" in shipping address" })     
        }

        // check if email is unique
        let isUniqueEmail = await userModel.findOne({email : email});
        if(isUniqueEmail) return res.status(400).send({status : false , message : "email already register"});
        // check is number is unique
        let isUniquePhone = await userModel.findOne({phone : phone});
        if(isUniquePhone) return res.status(400).send({status : false , message : "phone number already register"});

        //encrypting password
        const saltRounds = 10; 
        const hash = bcrypt.hashSync(data.password, saltRounds);
        data.password = hash

        //uploading profileImage to AWS S3
        const profileImageUrl = await uploadFile(file[0]);
        data["profileImage"] = profileImageUrl

        const savedData = await userModel.create(data);

        res.status(201).send({ status: true,message: "User created successfully", data: savedData })
        
    } catch (error) {
        return res.status(500).send({ status: false, message: error })
    }

};


const userLogin = async function (req , res) {
    const data = req.body;
    const {email , password} = data;

    if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "pls provide user email and password" });
    if (!email) return res.status(400).send({ status: false, message: "enter email" });
    if (!password) return res.status(400).send({ status: false, message: "enter password" });
    if (!isValid(email)) return res.status(400).send({ status: false, message: "email not valid" });
    if (!isValid(password)) return res.status(400).send({ status: false, message: "password not valid" });
        
    // if (!validateEmail(email)) return res.status(400).send({ status: false, message: "Invalid email" });
        
    const validEmail = await userModel.findOne({email : email});
    if(!validEmail) return res.status(401).send({
        status : false,
        message : "invalid email or email not register"
    });

    let hash = validEmail.password 
    let compare = bcrypt.compareSync(password, hash)
    if (!compare) return res.status(401).send({ status: false, msg: "Password Incorrect" })

    let token = jwt.sign({
        userId: validEmail._id.toString(),
        iat: Math.floor(new Date().getTime() / 1000)
    },
    "Product Management Project@#$%", 
    { expiresIn: "3h" });

    const resData = {};
    resData["userId"] = validEmail._id;
    resData["token"] = token;
    
    res.setHeader("x-api-key", token);
    return res.status(200).send({status : true , message : "User login successfull", data : resData})
};


const getUserProfile = async function (req , res) {
    try {
        const userId = req.params.userId;
        
        const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
        if(!isValidObjectId) return res.status(400).send({status : false , message : "not a valid UserId"})

        const userProfile = await userModel.findById({_id : userId});
        if(!userProfile) return res.status(404).send({
            status : false,
            message : "no user found with this userId"
        });

        return res.status(200).send({status : true ,message : "User profile details", data : userProfile});

    } catch (error) {
        return res.status(500).send({ status: false, message: error })
    }
};



const updateUser = async function (req , res) {
    try {
        let data = req.body
        const userId = req.params.userId
        const files = req.files

        let userdata = await userModel.findOne({ _id: userId }).select({ _id: 0, updatedAt: 0, createdAt: 0, __v: 0 }).lean();

        if (data.fname) {
            if (!validator.isAlpha(data.fname)) return res.status(400).send({ status: false, msg: 'fname must be between a-z or A-Z' })
            userdata.fname = data.fname
        }

        if (data.lname) {
            if (!validator.isAlpha(data.lname)) return res.status(400).send({ status: false, msg: 'lname must be between a-z or A-Z' })
            userdata.lname = data.lname
        }
        if (data.password) {
            if (data.password.length < 8 || data.password.length > 15) return res.status(400).send({ status: false, msg: 'password must be at least 8 characters long and should be less than 15 characters' })
            //password regex
            const saltRounds = 10;
            const hash = bcrypt.hashSync(data.password, saltRounds);
            userdata.password = hash
        }

        if (data.address) {
            if (data.address.billing) {
                if (data.address.billing.city) {
                    if (!validator.isAlpha(data.address.billing.city)) return res.status(400).send({ status: false, msg: 'city name in billing should not contain number' })
                    userdata.address.billing.city = data.address.billing.city
                }
            }
        }
        if (data.address) {
            if (data.address.billing) {
                if (data.address.billing.pincode) {
                    if (!validPinCode(data.address.billing.pincode)) return res.status(400).send({ status: false, msg: "Enter valid pin code billing address" });
                    userdata.address.billing.pincode = data.address.billing.pincode
                }
            }
        }
        if (data.address) {
            if (data.address.billing) {
                if (data.address.billing.street) {
                    userdata.address.billing.street = data.address.billing.street
                }
            }
        }

        if (data.address) {
            if (data.address.shipping) {
                if (data.address.shipping.city) {
                    if (!validator.isAlpha(data.address.shipping.city)) return res.status(400).send({ status: false, msg: 'city name in shipping must be between a-z or A-Z' })
                    userdata.address.shipping.city = data.address.shipping.city
                }
            }
        }

        if (data.address) {
            if (data.address.shipping) {
                if (data.address.shipping.pincode) {
                    if (!validPinCode(data.address.shipping.pincode)) return res.status(400).send({ status: false, msg: "Enter valid pin code shipping address" });
                    userdata.address.shipping.pincode = data.address.shipping.pincode
                }
            }
        }

        if (data.address) {
            if (data.address.shipping) {
                if (data.address.shipping.street) {
                    userdata.address.shipping.street = data.address.shipping.street
                }
            }
        }

        if (data.email) {
            if (!validateEmail(email)) return res.status(400).send({ status: false, message: "Invalid email" });
            checkEmail = await userModel.findOne({email:data.email,_id:{$ne:userId}})
            if(checkEmail){return res.status(400).send({status:false,msg:`this email ${data.email} is already register try another Email`})}
    
            userdata.email = data.email
            //check for uniqueness 
        }
        if (data.phone) {
            if (!validateMobile(data.phone)) return res.status(400).send({ status: false, msg: "must be valid mobile number" });
             checkPhone  = await userModel.findOne({phone:data.phone,_id:{$ne:userId}})
            if(checkPhone){return res.status(400).send({status:false,msg:"this Phone number already exist"})}
            
            userdata.phone = data.phone
            //check for uniqueness 
        }
       
            if (files && files.length > 0) {
                let formate = files[0].originalname
                let uploadedFileURL = await uploadFile(files[0])
                userdata.profileImage = uploadedFileURL
            }

       let updatedData = await userModel.findOneAndUpdate({ _id: userId }, { $set: userdata }, { new: true });
        // updatedData= updatedData.toObject()
        // delete updatedData.password

        return res.status(200).send({ status: true,message:"data updated successfully", data: updatedData })

    } catch (err) {
       
        return res.status(500).send({ error: err.message })
    }
};

module.exports.createUser = createUser;
module.exports.userLogin = userLogin;
module.exports.getUserProfile = getUserProfile;
module.exports.updateUser = updateUser;