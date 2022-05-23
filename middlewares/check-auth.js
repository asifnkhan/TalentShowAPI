const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/token.model');

authenticate = async (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access denied. No token provided.');
    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded;

        const refreshTokens = await RefreshToken.find({ userId: req.user.id });
        req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);
        next();
    } catch (ex) {
        console.log(ex);
        res.status(400).send('Invalid token.');
    }
}

module.exports = authenticate;