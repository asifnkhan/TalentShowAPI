const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const User = require('../models/user.model');
const RefreshToken = require('../models/token.model');

async function authenticate({ email, password }) {
    const account = await User.findOne({ email });
    if (!account || !(await bcrypt.compare(password, account.password))) {
        throw 'Email or password is incorrect';
    }

    // authentication successful so generate jwt and refresh tokens
    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account);

    // save refresh token
    await refreshToken.save();

    // return basic details and tokens
    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token }) {
    const refreshToken = await getRefreshToken(token);
    const { user } = refreshToken;

    // delete old refresh token and generate a new one
    const newRefreshToken = generateRefreshToken(user);
    await newRefreshToken.save();

    await RefreshToken.findOneAndDelete({ token: refreshToken.token });

    // generate new jwt
    const jwtToken = generateJwtToken(user);

    // return basic details and tokens
    return {
        ...basicDetails(user),
        jwtToken,
        refreshToken: newRefreshToken.token
    };
}

async function revokeToken({ token }) {
    // delete the refresh token
    await RefreshToken.findOneAndDelete({ token });
}

// helper functions

async function getRefreshToken(token) {
    const refreshToken = await RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
    return refreshToken;
}

function generateJwtToken(account) {
    // create a jwt token containing the account id that expires in 15 minutes
    return jwt.sign({ sub: account.id, id: account.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(account) {
    // delete old refresh token for the same account/user
    RefreshToken.deleteMany({ userId: account.id }).exec();

    // create a refresh token that expires in 1 day
    return new RefreshToken({
        userId: account.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    });
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function basicDetails(account) {
    const { id, name, email } = account;
    return { id, name, email };
}

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    randomTokenString
};