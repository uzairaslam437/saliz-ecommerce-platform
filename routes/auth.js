const express = require("express");
const router = express.Router();
const {signUp,verifyEmail,signIn,resendVerificationMail,refreshAcessToken} = require("../controllers/auth");
const {verifyToken} = require("../middlewares/auth")

router.post("/signup",signUp);
router.post("/signin",signIn);
router.post("/verify-email",verifyEmail);
router.post("/resend-verification",resendVerificationMail);
router.post("/refresh-token",verifyToken,refreshAcessToken);

module.exports = router;
