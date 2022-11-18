import { promisify } from "util";

import jsonwebtoken from "jsonwebtoken";
const { sign, verify } = jsonwebtoken;

import catchAsync from "../../helper/catchAsync.js";
import AppError from "../../helper/appError.js";
import User from "../../models/userModel.js";
import config from "../../core/config.js";

// Function to generate jwt sign token
const signToken = (id) => {
    return sign({ id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    res.cookie("jwt", token, {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    });

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

export const signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);
    res.status(201).json({
        status: "success",
        message: "You are signed up. Please use /api/v1/auth/signin to sign in",
        data: {
            newUser,
        },
    });
});

export const signin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //Check if email and password exists
    if (!email || !password) {
        return next(new AppError("Please provide email and password!", 400));
    }

    //Check if user exist and password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password!", 401));
    }

    // If everything is okay, then send token to client
    createSendToken(user, 200, req, res);
});

// Logout the user by sending cookie without token
export function logout(req, res) {
    res.cookie("jwt", "", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    res.status(200).json({
        status: "success",
    });
}

export const protect = catchAsync(async (req, res, next) => {
    let token;

    // 1) Get the token and check it's there
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(
            new AppError(
                "You are not logged in, please login to get access",
                401
            )
        ); //401 - Unauthorized
    }

    // 2) Varification of token

    const decoded = await promisify(verify)(token, config.jwt.secret);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                "The user belongs to this token does no longer exist.",
                401
            )
        );
    }

    // Grant access to the prodected rout
    req.user = currentUser;
    res.locals.user = currentUser;

    next();
});
