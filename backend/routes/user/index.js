const express = require("express");

const router = express.Router();

router.use("/emergency", require("./emergency"));

module.exports = router;
