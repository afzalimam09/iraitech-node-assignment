import mongoose from "mongoose";
import validator from "validator";
const { isEmail } = validator;
import bcryptjs from "bcryptjs";
const { hash, compare } = bcryptjs;

import db from "../connections/dbConnection.js";

const Schema = mongoose.Schema;

//Creating User Schema
const userSchema = new Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "Please provide your email address!"],
        unique: true,
        lowercase: true,
        validate: [isEmail, "Please provide a valid email!"],
    },
    password: {
        type: String,
        required: [true, "Please provide a password!"],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please confirm your password!"],
        validate: {
            // This only works on save and create
            validator: function (el) {
                return el === this.password;
            },
            message: "Password must be same!",
        },
    },
    image: {
        type: String,
    },
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

// This middleware will run before saving the data to the database
userSchema.pre("save", async function (next) {
    // if password is not modified then skip encryption and continue with rest of the code
    if (!this.isModified("password")) return next();

    // Encrypt and and stare the password
    this.password = await hash(this.password, 12);

    // Set the confirm password to undefined because we no longer need this
    this.passwordConfirm = undefined;

    next();
});

// To select only active users
userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({ active: { $ne: false } });
    next();
});

// Create instance method that will check password is correct or not
userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await compare(candidatePassword, userPassword);
};

//Create Model out of Schema

const User = db.model("User", userSchema);

export default User;
