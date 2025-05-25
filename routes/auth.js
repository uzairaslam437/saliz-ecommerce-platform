const express = require("express");
const router = express.Router();
const {signUp,verifyEmail,signIn} = require("../controllers/auth");

router.post("/signup",signUp);
router.post("/signin",signIn);
router.post("/verify-email/:Id",verifyEmail);

module.exports = router;
