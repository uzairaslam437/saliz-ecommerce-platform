const express = require("express");
const router = express.Router();
const { addVenderDetails, addVendorBankDetails } = require("../controllers/vendor");

const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
require('dotenv').config();


// Create S3 client with v3 configuration
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

// Multer S3 storage config
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read', // or 'private' if you want it locked
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `uploads/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

const vendorAuthorization = (req,res,next) =>{
  if (req.user.role !== "vendor"){
    console.log("User is not a vendor. Not Authorized")
    return res.status(403).json({message: "First register yourself as Saliz Vendor"})
  }
}

router.post("/details",vendorAuthorization, upload.single('logo'), addVenderDetails);
router.post("/bank-details",vendorAuthorization, addVendorBankDetails);

module.exports = router;