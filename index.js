require("dotenv").config();
const express = require("express");
const app = express();
const {initDb} = require("./model/db")
const authRouter = require("./routes/auth");
const vendorRouter = require("./routes/vendor");
const productRouter = require("./routes/product");
const cartRouter    = require("./routes/cart");
const orderRouter   = require("./routes/order");
const { verifyToken } = require("./middlewares/auth")
const {cleanupExpiredAndUsedTokens} = require("./util/index");
const PORT = process.env.PORT || 5000;
require("dotenv").config();

initDb();

// Add this temporarily for debugging
// console.log('AWS_ACCESS_KEY:', process.env.AWS_ACCESS_KEY ? 'Set' : 'Not set');
// console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
// console.log('AWS_REGION:', process.env.AWS_REGION);
// console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);

app.use(express.json());
app.use("/auth",authRouter);
app.use("/vendor",verifyToken,vendorRouter);
app.use("/product",verifyToken,productRouter);
app.use("/cart",verifyToken,cartRouter);
app.use("/order",verifyToken,orderRouter);

setInterval(cleanupExpiredAndUsedTokens,60 * 60 * 1000);

app.listen(PORT,()=>{
    console.log(`Server is running on PORT:${PORT}`);
});