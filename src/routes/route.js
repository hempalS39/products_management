const express = require('express');
const router = express.Router();

const {authentication , authorise} = require('../middleware/auth');
const {createUser , userLogin , getUserProfile, updateUser} = require('../controllers/userController');
const {createProduct,getProducts, getProductById,updateProduct, deleteProduct} = require('../controllers/productController');
const {createCart , updateCart ,getCart , deleteCart} = require('../controllers/cartController');
const {createOrder , updateOrder} = require('../controllers/orderController');
// routes for user
router.post('/register' , createUser);
router.post('/login' , userLogin);
router.get('/user/:userId/profile' ,authentication,authorise, getUserProfile);
router.put('/user/:userId/profile' ,authentication,authorise, updateUser);

// routres for product :
router.post('/products' , createProduct);
router.get('/products' , getProducts);
router.get('/products/:productId' ,getProductById);
router.put('/products/:productId' , updateProduct);
router.delete('/products/:productId' , deleteProduct);

//routes for cart :
router.post('/users/:userId/cart' ,authentication,authorise, createCart);
router.put('/users/:userId/cart' ,authentication,authorise, updateCart); 
router.get('/users/:userId/cart',authentication,authorise,getCart)         
router.delete('/users/:userId/cart',authentication,authorise,deleteCart)

//routes for order :
router.post('/users/:userId/orders',authentication,authorise,createOrder)
router.put('/users/:userId/orders',authentication,authorise,updateOrder)

module.exports = router;