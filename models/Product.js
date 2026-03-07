const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên sản phẩm'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        required: [true, 'Vui lòng chọn danh mục'],
        enum: ['design', 'ai', 'entertainment', 'security', 'education', 'software']
    },
    price: {
        type: Number,
        required: [true, 'Vui lòng nhập giá'],
        min: 0
    },
    image: {
        type: String,
        required: [true, 'Vui lòng nhập URL hình ảnh']
    },
    badge: {
        type: String,
        enum: ['', 'HOT', 'NEW', 'SALE', 'VIP'],
        default: ''
    },
    sold: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        default: 999
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
ProductSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Product', ProductSchema);
