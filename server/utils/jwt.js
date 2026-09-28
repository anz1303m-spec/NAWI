const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "nawi_jwt_access_secret_key_2026_schrodinger_987654321";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "nawi_jwt_refresh_secret_key_2026_schrodinger_123456789";

const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

// Generate short-lived Access Token
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRY }
    );
};

// Generate long-lived Refresh Token
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY }
    );
};

// Verify Access Token
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, ACCESS_SECRET);
    } catch (err) {
        return null;
    }
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_SECRET);
    } catch (err) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
