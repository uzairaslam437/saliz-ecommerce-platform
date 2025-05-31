require("dotenv").config();
const express = require("express");
const app = express();
const {initDb} = require("./config/db")
const authRouter = require("./routes/auth");
const appRouter = require("./routes/app");
const vendorRouter = require("./routes/vendor");
const { verifyToken } = require("./middlewares/auth")
const {cleanupExpiredAndUsedTokens} = require("./util/index")
const PORT = process.env.PORT || 5000;

initDb();

app.use(express.json());
app.use("/auth",authRouter);
app.use("/saliz",verifyToken,appRouter);
app.use("/vendor",verifyToken,vendorRouter);

setInterval(cleanupExpiredAndUsedTokens,60 * 60 * 1000);

app.listen(PORT,()=>{
    console.log(`Server is running on PORT:${PORT}`);
});