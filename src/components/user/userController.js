import multer from "multer";

import User from "../../models/userModel.js";
import catchAsync from "../../helper/catchAsync.js";
import AppError from "../../helper/appError.js";

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public");
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
    },
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(
            new AppError("Not an image! Please upload only images.", 400),
            false
        );
    }
};

export const uploadUserPhoto = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
}).single("image");

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

export const editProfile = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                "Password can't be updated like this. I am working on it",
                400
            )
        );
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, "name", "email", "image");
    if (req.file) filteredBody.image = req.file.path.replace("\\", "/");

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser,
        },
    });
});

export const getProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        status: "success",
        user,
    });
});

export const getUserList = catchAsync(async (req, res, next) => {
    const userList = await User.find({
        active: false,
    });
    res.status(200).json({
        status: "success",
        results: userList.length,
        userList,
    });
});
