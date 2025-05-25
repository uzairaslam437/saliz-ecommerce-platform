const express = require("express")
const router  = express.Router();
const {privateFunction} = require("../controllers/app")

router.get("/",privateFunction);

module.exports = router;