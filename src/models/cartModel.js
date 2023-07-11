const mongoose =require('mongoose')
const objectId =mongoose.Schema.Types.ObjectId


const cartSchema = new mongoose.Schema({
  userId: {
    type: objectId,
    refs: 'User',
    required: true,
    unique : true
  },
  items: [{
    productId: {
         type:objectId,
        refs:'Product',
        required: true 
    },
    quantity: {
         type: Number, 
         required: true 
        },
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  }
}, { timestamps: true })



module.exports = mongoose.model('Cart', cartSchema)