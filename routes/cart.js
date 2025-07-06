const express = require("express")
const router  = express.Router();
const {addToCart,getCart,updateCartAdd,updateCartRemove,deleteCart} = require("../controllers/cart")

router.post("/",addToCart);
router.get("/",getCart);
router.put("/:productId",updateCartAdd);
router.delete("/:productId",updateCartRemove);
router.delete("/api/clear/",deleteCart);

module.exports = router;