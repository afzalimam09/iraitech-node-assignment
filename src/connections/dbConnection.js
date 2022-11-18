import mongoose from "mongoose";
import config from "../core/config.js";

mongoose.connect(config.db.str, config.db.options);

const db = mongoose.connection;

//When successfully connected
db.on("connected", () => {
    console.log("Database connected successfully!!");
});

//If the connection throws an error
db.on("error", (err) => {
    console.log(`Mongoose connection error for master DB: ${err}`);
});

// When the connection is disconnected
db.on("disconnected", () => {
    console.log("Mongoose connection disconnected for master DB");
});

// When connection is reconnected
db.on("reconnected", () => {
    console.log("Mongoose connection reconnected for master DB");
});

export default db;
