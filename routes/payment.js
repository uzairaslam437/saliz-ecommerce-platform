const router = require("express").Router();
const { createCheckoutSession } = require("../controllers/payment");

router.post("/create-checkout-session", createCheckoutSession);

module.exports = router;

//https://docs.stripe.com/stripe-cli?install-method=windows