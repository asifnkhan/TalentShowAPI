const { default: mongoose } = require("mongoose");

const User = new mongoose.model("User", {
    fullName: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 30,
        validate: {
            validator: (value) => {
                return /(^[a-zA-Z][a-zA-Z\s]{0,20}[a-zA-Z]$)/.test(value);
            },
            message: "Only letters and spaces are allowed"
        }
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email is already in use"],
        trim: true,
        minlength: 3,
        validate: {
            validator: (value) => {
                return /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(value);
            },
            message: 'Not a valid email'
        }
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        trim: true,
        minlength: 6,
    },
    dob: {
        type: Date,
        validate: {
            validator: (value) => {
                return new Date(value) < new Date();
            },
            message: `Not a valid date`
        }
    },
    address: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 30,
    },
    applicationId: {
        type: String,        
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
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

module.exports = User;