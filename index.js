require("dotenv").config();
const express = require("express");
const app = express();
const {initDb} = require("./model/db")
const cors = require('cors');
const cookieParser = require('cookie-parser')
const authRouter = require("./routes/auth");
const vendorRouter = require("./routes/vendor");
const productRouter = require("./routes/product");
const cartRouter    = require("./routes/cart");
const orderRouter   = require("./routes/order");
const paymentRouter = require("./routes/payment");
const { verifyToken } = require("./middlewares/auth")
const {cleanupExpiredAndUsedTokens} = require("./util/index");
const PORT = process.env.PORT || 3002;
require("dotenv").config();

initDb();

// Add this temporarily for debugging
// console.log('AWS_ACCESS_KEY:', process.env.AWS_ACCESS_KEY ? 'Set' : 'Not set');
// console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
// console.log('AWS_REGION:', process.env.AWS_REGION);
// console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);

app.use(cors({
  origin: 'http://localhost:5173', // Frontend origin
  credentials: true, // Allow cookies to be sent
}));

app.use(cookieParser())

app.use(express.json());
app.use("/auth",authRouter);
app.use("/vendor",verifyToken,vendorRouter);
app.use("/product",verifyToken,productRouter);
app.use("/cart",verifyToken,cartRouter);
app.use("/order",verifyToken,orderRouter);
app.use("/payment",verifyToken,paymentRouter);

setInterval(cleanupExpiredAndUsedTokens,60 * 60 * 1000);

app.listen(PORT,()=>{
    console.log(`Server is running on PORT:${PORT}`);
});