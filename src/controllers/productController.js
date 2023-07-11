const productModel = require('../models/productModel');
const {uploadFile} = require('../config/aws');
const {isValid} = require('../utils/validations');
const { default: mongoose } = require('mongoose');


const createProduct = async function (req , res) {
   try {
    const data = req.body;
    const file = req.files;
    // console.log(files)
    if(Object.keys(data).length == 0) return res.status(400).send({status : false , message : "pls provide product details"})
    if(!file || !file.length) return res.status(400).send({status : false , message : "pls provide product image"});
    
    const {title , description, price , currencyId, currencyFormat , availableSizes} = data;
    const dataFields = Object.keys(data);
    const requiredFields = ["title" , "description", "price" , "currencyId", "currencyFormat" , "availableSizes"]
    
    for(let i=0; i<requiredFields.length; i++){
        if(!dataFields.includes(requiredFields[i])) return res.status(400).send({
            status : false,
            message : `${requiredFields[i]} is required`
        })
        if(!isValid(data[requiredFields[i]])) return res.status(400).send({
            status : false,  
            message : `${requiredFields[i]} is invalid`
        })
    }

    //-----for unique title
    let uniqueTitle = await productModel.findOne({ title: title });
    if(uniqueTitle) return res.status(404).send({ status: false, message: "title should be unique" });

    if (price.trim()) {
        let Price=Number(price.trim())
        if(isNaN(Price)|| Price<0) return res.status(400).send({status: false,msg: "Enter valid price "})
    }    
    // validating availableSizes 
    let sizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
    let reqSize = availableSizes.split(",");


    for(let i=0; i<reqSize.length; i++){
        if(!sizes.includes(reqSize[i].trim().toUpperCase())) return res.status(400).send({
            status : false,
            message : "size should be from S,XS,M,X,L,XXL,XL"
        })
    };
    data.availableSizes = reqSize.map((x) => { return x.toUpperCase()})
    
    if(data.isFreeShipping){
        if(!data.isFreeShipping == "true" || !data.isFreeShipping == "false"){
            return res.status(400).send({
                status : false,
                message : "isFreeShipping should be a boolean value either true or false"
            })
        }
    };

    //uploading profileImage to AWS S3
    const productImageUrl = await uploadFile(file[0]);
    data["productImage"] = productImageUrl

    const savedData = await productModel.create(data);

    return res.status(201).send({status : true, data : savedData});

   } catch (error) {
        return res.status(500).send({status:false , message : error})
   }

};


const getProducts = async function (req, res) {
    try {
        let requestQuery = req.query;
        let findData = { isDeleted: false };

        if (requestQuery.name) {
            findData["title"] =requestQuery.name.toLowerCase() //  { $regex: requestQuery.name.toLowerCase() };
        }

        if (requestQuery.size) {
            let sizeFilter = requestQuery.size.split(",");
            sizeFilter = sizeFilter.map(function (x) {
            return x.toUpperCase()});
        
            let sizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
            for (i = 0; i < sizeFilter.length; i++) {
                if (!sizes.includes(sizeFilter[i]))
                return res.status(400).send({status: false,message: `size '${sizeFilter[i]}' is not valid search request`,
                });
            }
            findData["availableSizes"] = { $all: sizeFilter };
        }

        if (requestQuery.priceGreaterThan) {
            
            let Price=Number(requestQuery.priceGreaterThan.trim())
            if(isNaN(Price)|| Price<0) return res.status(400).send({status: false,msg: "Enter valid price "})
          
            // let gtValue = Math.ceil(requestQuery.priceGreaterThan);
            // let validPrice = /^\d+$/.test(gtValue);//can use NAN rather regex, can remove math.ceil
            // if (!validPrice) 
            //     return res.status(400).send({status: false,msg: "Enter valid input in priceGreaterThan",});
            findData["price"] = { $gt: requestQuery.priceGreaterThan };
        }

        if (requestQuery.priceLessThan) {
            let Price=Number(requestQuery.priceLessThan.trim())
            if(isNaN(Price)|| Price<0) return res.status(400).send({status: false,msg: "Enter valid price "})
          
            findData["price"] = { $lt: requestQuery.priceLessThan };
        }

        let findProduct = await productModel.find(findData).sort({ price: 1 });
        
        if (findProduct.length == 0){
            return res.status(404).send({ status: false, msg: "no data found with this filters" });
        }
        
        return res.status(200).send({ status: true, message: "success", data: findProduct });

    } catch (error) {
        res.status(500).send({status:false,error:error.message});
    }
};



const getProductById = async function (req , res) {
    try {
        const productId = req.params.productId;

        const isValidObjectId = mongoose.Types.ObjectId.isValid(productId);
        if(!isValidObjectId) return res.status(400).send({status : false , message : "not a valid productId"})

        const productDetails = await productModel.findById({isDeleted : false, _id : productId});

        if(!productDetails) return res.status(404).send({
            status : false,
            message : "no product found with this productId"
        })

        return res.status(200).send({status : true , data : productDetails})
    } catch (error) {
        return res.status(500).send({status:false , message : error})
    }
};


const updateProduct = async function (req , res) {
    try {
        const productId = req.params.productId;
        const data = req.body;

        const isValidObjectId = mongoose.Types.ObjectId.isValid(productId);
        if(!isValidObjectId) return res.status(400).send({status : false , message : "not a valid productId"})

        const productData = await productModel.findById({isDeleted : false, _id : productId});
        if(!productData) return res.status(404).send({status : false,message : "no product found with this productId"})
        
        if(data.title){
            if (!isValid(data.title)) return res.status(400).send({ status: false, message: "title not valid" });
            const uniqueTitle = await productModel.findOne({title : data.title});
            if(uniqueTitle) return res.status(400).send({
                status : false,
                message : "this title is already present"
            });

            productData.title = data.title
        }
        if (data.description) {
            if (data.description.trim() == "") { return res.status(400).send({ status: false, msg: " input is empty" }) };
            productData.description = data.description;//null
        }
        if (data.price) {
            if (data.price === 'null' || data.price < 0) { return res.status(400).send({ status: false, message: "Enter price" }) }
            
            let Price=Number(data.price.trim())
            if(isNaN(Price)|| Price<0) return res.status(400).send({status: false,msg: "Enter valid price "})
            productPrice = Number.parseFloat(data.price).toFixed(2)
            
            productData.price = productPrice
        }
        //if //lowercase
        if (data.isFreeShipping) {
            let isFreeShippingValid = data.isFreeShipping.trim().toLowerCase();
            if (!(isFreeShippingValid == "true" || isFreeShippingValid == "false")) { return res.status(400).send({ status: false, msg: "Input must be in True or False" }) }
            productData.isFreeShipping = isFreeShippingValid;
        }

        if (data.style) {
            if (data.style.trim() == "") { return res.status(400).send({ status: false, msg: " input is empty" }) };
            productData.style = data.style;
        }

        if (data.availableSizes) {
            var size = data.availableSizes.split(",")

            for (let i = 0; i < size.length; i++) {
                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i].trim().toUpperCase())) {
                    return res.status(400).send({ status: false, message: "Size Must Contain S, XS, M, X, L, XXL, XL" });
                }

                productData.availableSizes = data.availableSizes.toUpperCase().split(",")
            }
        }
        if (data.installments) {
            if (data.installments.trim() == "") { return res.status(400).send({ status: false, msg: "installments input is empty" }) };
            productData.installments = data.installments;
        }
        if (files) if (files.length != 0) {
            if (files && files.length > 0) {
                // let formate = files[0].originalname
                // if (!(/\.(jpe?g|png|gif|bmp)$/i.test(formate) || /\.(mkv|mov|mp4)$/i.test(formate))) return res.status(400).send({ status: false, message: "file must be an image(jpg,png,jpeg,gif) OR Video (mkv,mp4,mov)" })

                let uploadedFileURL = await uploadFile(files[0])
                productData.productImage = uploadedFileURL
            }
            else { return res.status(400).send({ msg: "Enter The Product image" }) }
        }
        //image valid formate

        let updatedData = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: productData }, { new: true });

        if (updatedData == null) return res.status(404).send({ status: false, msg: "This product is deleted" })

        return res.status(200).send({ status: true, message: updatedData })

    } catch (error) {
        return res.status(500).send({status:false , message : error})
    }
};

const deleteProduct = async function (req , res) {
    try {
        const productId = req.params.productId;
        const isValidObjectId = mongoose.Types.ObjectId.isValid(productId);
        if(!isValidObjectId) return res.status(400).send({status : false , message : "not a valid productId"})

        const product = await productModel.findOne({_id : productId , isDeleted : false});
        if(!product) return res.status(400).send({
            status : false,
            message : "product on found or already deleted"
        });

        const productDelete = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() })
        
        return res.status(200).send({ status: true, msg: "product deleted successfully" })

    } catch (error) {
        return res.status(500).send({status:false , message : error});
    }
}

module.exports.createProduct = createProduct;
module.exports.getProducts = getProducts;
module.exports.getProductById = getProductById;
module.exports.updateProduct = updateProduct;
module.exports.deleteProduct = deleteProduct;