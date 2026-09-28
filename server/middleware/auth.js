const rateLimit = require("express-rate-limit");
const { verifyAccessToken } = require("../utils/jwt");

// Rate limiter for public verification endpoint (protect against ID enumeration scraping)
const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes per IP
    message: { status: "ERROR", error: "Too many verification attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false
});

// Middleware: Protect Routes with Access Token
const authMiddleware = async (req, res, next) => {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({ error: "Access token missing. Please log in." });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
        return res.status(401).json({ error: "Access token expired or invalid", code: "TOKEN_EXPIRED" });
    }

    req.user = decoded;
    req.username = decoded.name || (decoded.role === "admin" ? "Admin" : "Nishant");
    req.userRole = decoded.role;
    next();
};

// Middleware: Admin Only
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Access Denied: Admin authorization required." });
    }
    next();
};

// Helper: Set Secure Auth Cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie("role", res.req.userRole || "tester", { httpOnly: false, sameSite: "lax" });
    res.cookie("username", res.req.username || "User", { httpOnly: false, sameSite: "lax" });
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    verifyLimiter,
    setAuthCookies
};
