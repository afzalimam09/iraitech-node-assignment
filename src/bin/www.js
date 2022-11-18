import app from "../app.js";

if (process.env.NODE_ENV === "production") {
    process.on("uncaughtException", (err) => {
        console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
        console.log(err.name, err.message);
        process.exit(1);
    });
}

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
});

process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...");
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on("SIGTERM", () => {
    console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
    server.close(() => {
        console.log("💥 Process terminated!");
    });
});
