const jwt = require("jsonwebtoken");
require("dotenv").config();
 
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        console.log("Authorization Header:", authHeader);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No or invalid Authorization header" });
        }

        const token = authHeader.split(" ")[1]; 
        console.log("Extracted Token:", token);

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.log(`Error in verification of token ${error}`);
        return res.status(401).json({ message: "Invalid or malformed token" });
    }
};

module.exports = {verifyToken};