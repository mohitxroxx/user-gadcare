const jwt_token = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    // const token = req.headers["authorization"] ;
    // const token = authHeader && authHeader.split(" ")[1];
    // console.log(token)
    if (!token) {
        return res.status(403).send("Session Expired. Please log in again to continue.");
    }

    try {
        const decoded = jwt_token.verify(token, config.TOKEN_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).send("Error occurred. Please log in again.");
    }
};

module.exports = verifyToken; 
