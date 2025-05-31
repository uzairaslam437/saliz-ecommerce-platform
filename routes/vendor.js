const express = require("express");
const router = express.Router();
const {addVenderDetails,addVendorBankDetails} = require("../controllers/vendor");

router.post("/add",addVenderDetails);
router.post("/add-bank-details",addVendorBankDetails);

module.exports = router;