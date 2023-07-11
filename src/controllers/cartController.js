const cartModel = require('../models/cartModel');
const userModel = require('../models/userModel')
const productModel = require('../models/productModel');
const mongoose = require('mongoose');


const createCart = async function (req , res) {
    try {
        const userId = req.params.userId;
        const data = req.body;
        const {productId} = data;

        const isValidUserId = mongoose.Types.ObjectId.isValid(userId);
        if(!isValidUserId) return res.status(400).send({status : false , message : "not a valid userId"});

        const isValidProductId = mongoose.Types.ObjectId.isValid(productId);
        if(!isValidProductId) return res.status(400).send({status : false , message : "not a valid productId"});

        const isValidUser = await userModel.findById({isDeleted : false ,_id : userId});
        if(!isValidUser) return res.status(404).send({
            status : false,
            message : "no user found with this userId"
        });
        // console.log(isValidUser)
        const findProduct = await productModel.findOne({isDeleted : false,_id : productId});
        if(!findProduct) return res.status(404).send({
            status : false,
            message : "no user found with this userId"
        });
        console.log(userId)
        const cart = await cartModel.findOne({userId : userId});

        // if cart is not present , create a new cart
        console.log(cart)
        if(!cart) {
            data["userId"] = userId,
            data["items"] = [{productId : productId , quantity : 1}],
            data["totalPrice"] = findProduct.price
            data["totalItems"] = 1

            delete data.productId
            let createCart = await cartModel.create(data);
            // console.log(createCart)
            return res.status(201).send({status : true , data : createCart})
        }
        // remove extra id inside array in new cart

        // if cart already present 
        for(let i=0; i<cart.items.length; i++){
            if(cart.items[i].productId == productId){
                cart.items[i].quantity = cart.items[i].quantity+1;
                cart.totalPrice = cart.totalPrice + findProduct.price;
                // cart.totalPrice=Number.parseFloat(cart.totalPrice+findProduct.price).toFixed(2)
                let addProduct = await cartModel.findOneAndUpdate(
                    {userId : userId}, {$set:{items:cart.items , totalPrice : cart.totalPrice}},{new:true})
                return res.status(201).send({status : true , data : addProduct})
            }
        }

        let newProduct = {
            productId : productId,
            quantity : 1
        }
        cart.items.push(newProduct);
        cart.totalPrice = cart.totalPrice + findProduct.price
        cart.totalItems = cart.totalItems+1
        let updateProduct = await cartModel.findOneAndUpdate(
            {userId : userId}, {$set:{items:cart.items , totalPrice : cart.totalPrice,totalItems:cart.totalItems}},{new:true})
        
        return res.status(201).send({status : true , data : updateProduct})
        
    } catch (error) {
        return res.status(500).send({status:false , message : error})
    }
};

const updateCart = async function (req, res) {
    try {//- Check if the productId exists and is not deleted before updating the cart.
        let user = req.params.userId
        let data = req.body
        let { productId,removeProduct } = data

        if(Object.keys(data).length==0)return res.status(400).send({ status: false, msg: "body can not be empty" });
        //--------------------------objectIt Validation.................//
        const isValidObjectId = mongoose.Types.ObjectId.isValid(productId);
        if (!isValidObjectId) return res.status(400).send({ status: false, message: "Invalid ProductId" })
        //---------------------checking in cart
        let cart = await cartModel.findOne({ userId: user})
        if (!cart) return res.status(404).send({ status: false, message: "cart does not exit" })
        //checking if cart is empty or not
        if (cart.items.length == 0) {return res.status(400).send({ status: false, message: "cart is empty" });}
        //------------------findingProduct.................//
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(404).send({ status: false, message: "Product not Found" })

        //----------finding productId from cart
        
        let productid = cart.items.filter(x =>
            x.productId.toString() == productId
        )

        if (productid.length == 0) {
            return res.status(400).send({ status: false, message: "Product is not present in cart" })
        }
        //finding position of productId in cart
        let index = cart.items.indexOf(productid[0]);

        if (removeProduct == 1) {
            cart.items[index].quantity -= 1;//updating quantity
            cart.totalPrice =Number.parseFloat(cart.totalPrice - product.price).toFixed(2)//updating price
            if (cart.items[index].quantity == 0) {
                cart.items.splice(index, 1)
            }
            cart.totalItems = cart.items.length
            cart.save();
        }

        if (removeProduct == 0) {

            cart.totalPrice = Number.parseFloat(cart.totalPrice - product.price * cart.items[index].quantity).toFixed(2)//updating price here
            cart.items.splice(index, 1)//removing product
            cart.totalItems = cart.items.length//updating items
            cart.save()
        }
 
        return res.status(200).send({ status: true, message: "Data updated successfully", data: cart })

    } catch (err) {
        return res.status(500).send({ message: err.message })
    }
};

let getCart = async function (req, res) {
    try {
        let userId = req.params.userId.trim();
        let getData = await cartModel.findOne({ userId: userId}).populate({path:'items.productId',model:'product',select:["_id","title","price","currencyFormat"]})
        if (getData==null) return res.status(404).send({ status: false, msg: "Cart for this user does not exist" });
        return res.status(200).send({ status: true, Data: getData })

    } catch (err) {
        console.log(err);
        return res.status(500).send({ status: false, Msg: err.Message })
    }
}


const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId.trim()
       
        const cart = await cartModel.findOne({ userId: userId }).select({ _id: 1 })
        if (!cart) { return res.status(404).send({ status: false, message: "Cart doe1s't exist" })}
     
        let deleteCart = await cartModel.findOneAndUpdate({ _id: cart }, { $set: { totalPrice: 0, totalItems: 0, items: [] } }, { new: true })
        return res.status(200).send()
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}




module.exports.createCart = createCart;
module.exports.updateCart = updateCart;
module.exports.getCart = getCart;
module.exports.deleteCart = deleteCart;