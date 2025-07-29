const express = require("express");
const router  = express.Router();
const {addProduct,getProduct,getStoreProducts,updateProduct,deleteProduct,getAllProducts} = require("../controllers/product");

const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const { verify } = require("jsonwebtoken");
require('dotenv').config();

// console.log(process.env.S3_BUCKET_NAME);

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
    // acl: 'public-read', // or 'private' if you want it locked
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `uploads/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

const verifyAuth = (req,res,next) => {
  if(req.user.role !== "vendor"){
    return res.status(403).json({message: "Not Authorization to add,get,update and delete products."});
  }
  next()
}

router.get("/all",getAllProducts);
router.get("/:id",getProduct);  

router.post("/add",verifyAuth,upload.array("images",3),addProduct);

router.get("/store/:vendorId",verifyAuth,getStoreProducts);
router.patch("/:id",verifyAuth,updateProduct);
router.delete("/:id",verifyAuth,deleteProduct);

module.exports = router;