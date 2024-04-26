const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true
    },
    ServiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'All Users',
        required: true
    },
    carePurchaseDate: {
        type: String,
        required: true
    },
    careExpiryDate: {
        type: String,
        required: true
    },
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    paymentIntent: {
        type: String,
    },
    paymentStatus: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    }
});

const Payment = mongoose.model('Payment Info', paymentSchema);

module.exports = Payment;
