require("dotenv").config();
const express = require("express");
const app = express();
const {initDb} = require("./config/db")
const authRouter = require("./routes/auth");
const appRouter = require("./routes/app");
const { verifyToken } = require("./middlewares/auth")
const PORT = process.env.PORT || 5000;

initDb();

app.use(express.json());
app.use("/auth",authRouter);
app.use("/",verifyToken,appRouter);

app.listen(PORT,()=>{
    console.log(`Server is running on PORT:${PORT}`);
});