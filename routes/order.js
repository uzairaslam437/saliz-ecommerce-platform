const express = require("express");
const router  = express.Router();
const {placeOrder,getUserOrderById,getOrderDetails,getAllOrders,updateOrderStatus,
    updatePaymentStatus,cancelOrder,getUserOrders} = require("../controllers/order");

const verifyAdmin = (req,res,next) => {
    if(req.user.role !== "vendor"){
        return res.status.json({message: "Only vendor is authorized to do this request."})
    }
    next()
}

// User Routes
router.post("/",placeOrder);
router.get("/",getUserOrders);
router.get("/:orderId",getUserOrderById);
router.delete("/:orderId",cancelOrder);

//Admin Routes
router.get("/admin/all",verifyAdmin,getAllOrders);
router.get("/admin/:orderId",verifyAdmin,getOrderDetails);
router.put("/admin/:orderId/order-status",verifyAdmin,updateOrderStatus);
router.put("/admin/:orderId/payment-status",verifyAdmin,updatePaymentStatus)


module.exports = router;
