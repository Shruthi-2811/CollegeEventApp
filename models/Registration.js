const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: true
    },

    registerNo: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    department: {
        type: String,
        required: true
    },

    year: {
        type: Number,
        required: true
    },

    eventName: {
        type: String,
        required: true
    },

    eventType: {
        type: String,
        required: true
    },

    idCard: {
        type: String,
        required: true
    },

    registeredAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Registration", registrationSchema);