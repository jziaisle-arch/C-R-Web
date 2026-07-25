const express = require("express");
const router = express.Router();

// API Info
router.get("/text", (req, res) => {
  res.json({
    success: true,
    name: "Text API",
    version: "1.0.0",
    endpoints: [
      "POST /api/text/split"
    ]
  });
});

// Split Text
router.post("/text/split", (req, res) => {
  const { text = "", separator = " " } = req.body;

  const parts = text.split(separator);

  res.json({
    success: true,
    original: text,
    separator,
    count: parts.length,
    parts
  });
});

module.exports = router;
