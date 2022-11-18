import AppError from './appError.js';

// Handle CastError DB
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400);
};
// Handle ValidationError DB
const handleValidationErrorDB = err => {
    const error = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${error.join('. ')}`;
    return new AppError(message, 400);
};
// Handle DuplicateFields DB
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another one!`
    return new AppError(message, 400);
};

// Handle JWT error
const handleJWTError = () => new AppError('Invalid token, please login again', 401);

// Handle JWT Expire error
const handleJWTExpiredError = () => new AppError('Your token has expired, please login again', 401);

// Function for sending error in development mode
const sendErrorDev = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode)
            .json({
                status: err.status,
                error: err,
                message: err.message,
                stack: err.stack
            });
    }
    //B) Render Website
    return res.status(err.statusCode)
        .render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });

};

// Function for sending error in production mode
const sendErrorProd = (err, req, res) => {

    // A) API
    if (req.originalUrl.startsWith('/api')) {
        // a) Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode)
                .json({
                    status: err.status,
                    message: err.message
                });
        }
        // log the error 
        console.error('Error ', err);

        // b) send generik message: don't leak error detail
        return res.status(500)
            .json({
                status: 'error',
                message: 'Something went wrong!'
            });

    }
    // B) Render Website
    // a) Operational, trusted error: send message to client
    if (err.isOperational) {
        return res.status(err.statusCode)
            .render('error', {
                title: 'Something went wrong!',
                msg: err.message
            });
    }
    // log the error 
    console.error('Error ', err);

    // b) send generik message: don't leak error detail
    return res.status(err.statusCode)
        .render('error', {
            title: 'Something went wrong!',
            msg: 'Please try again later.'
        });

};


// Global error controller
export default (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Different error message for development and production
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        // let error = { ...err };
        let error = err;
        error.message = err.message;
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
}