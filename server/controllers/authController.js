const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} = require("../utils/jwt");
const { setAuthCookies } = require("../middleware/auth");

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required." });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ error: "An account with this email already exists." });
        }

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: ["admin", "tester", "viewer"].includes(role) ? role : "tester"
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        req.userRole = user.role;
        req.username = user.name;
        setAuthCookies(res, accessToken, refreshToken);

        await AuditLog.create({
            user: user.name,
            action: "Registered Account",
            details: `Registered as ${user.role} (${user.email})`
        });

        res.status(201).json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        req.userRole = user.role;
        req.username = user.name;
        setAuthCookies(res, accessToken, refreshToken);

        await AuditLog.create({
            user: user.name,
            action: "Logged In",
            details: `IP / Session authenticated successfully`
        });

        res.json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: err.message });
    }
};

const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token missing. Please log in again." });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid or expired refresh token." });
        }

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ error: "Refresh token revoked or invalid." });
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        req.userRole = user.role;
        req.username = user.name;
        setAuthCookies(res, newAccessToken, newRefreshToken);

        res.json({
            success: true,
            accessToken: newAccessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getMe = async (req, res) => {
    try {
        let token = req.cookies.accessToken;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.json({ authenticated: false });
        }

        const decoded = verifyAccessToken(token);
        if (!decoded) {
            return res.json({ authenticated: false, reason: "expired" });
        }

        const user = await User.findById(decoded.id).select("-password -refreshToken");
        if (!user) {
            return res.json({ authenticated: false });
        }

        res.json({
            authenticated: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            role: user.role,
            username: user.name
        });
    } catch (err) {
        res.json({ authenticated: false });
    }
};

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = verifyRefreshToken(refreshToken);
            if (decoded && decoded.id) {
                await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
            }
        }
    } catch (e) {}

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("role");
    res.clearCookie("username");

    res.json({ success: true, message: "Logged out successfully" });
};

module.exports = {
    register,
    login,
    refresh,
    getMe,
    logout
};
