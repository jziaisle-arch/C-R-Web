const express = require("express");
const api = require("./routes/api");

const app = express();

app.use(express.json());

app.use("/api", api);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Text API",
    endpoints: [
      "GET /api/text",
      "POST /api/text/split"
    ]
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
