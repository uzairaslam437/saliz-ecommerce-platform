const jwt = require("jsonwebtoken");
require("dotenv").config();
 
const verifyToken = (req,res,next) => {
    try{
        const authHeader = req.headers["authorization"];
        const token = authHeader.split(" ")[1];      

        const decoded = jwt.verify(token,process.env.JWT_ACCESS_SECRET);

  

        if(decoded.role !== "customer" && decoded.role !== "vendor" && decoded.role !== "admin"){
            console.log(`Invalid token`);
            return res.status(400).json({message: `Invalid token`});
        }

        req.user = decoded;
        console.log(`Token Verified`)
        next()
    }
    catch(error){
        console.log(`Error in verification of token`);
        return res.status(500).json({message: `Error in verification of token`});
    }
}

module.exports = {verifyToken};