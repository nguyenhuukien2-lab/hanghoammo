const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    account: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'sold', 'reserved'],
        default: 'available'
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    soldAt: {
        type: Date
    },
    note: {
        type: String
    }
}, {
    timestamps: true
});

// Index for faster queries
accountSchema.index({ productId: 1, status: 1 });

module.exports = mongoose.model('Account', accountSchema);
