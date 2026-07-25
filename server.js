require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./database/db"); // Initializes the database
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Simple Auth API is running."
    });
});

const PORT = process.env.PORT || 3000;
const errorHandler = require("./middleware/errorHandler");

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});