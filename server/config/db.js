const mongoose = require("mongoose");
const User = require("../models/User");
const RuleSet = require("../models/RuleSet");

let cachedDb = null;
let isDbInitialized = false;

const initializeDatabase = async () => {
    if (isDbInitialized) return;
    isDbInitialized = true;
    try {
        // 1. Ensure default users exist in Centralized MongoDB
        const defaultUsers = [
            { name: "Dr. Raman Kumar", email: "admin@schrodingersincident.com", password: "admin123", role: "admin" },
            { name: "Nishant", email: "tester@schrodingersincident.com", password: "tester123", role: "tester" },
            { name: "Quality Reviewer", email: "viewer@schrodingersincident.com", password: "viewer123", role: "viewer" }
        ];

        for (const u of defaultUsers) {
            let user = await User.findOne({ email: u.email });
            if (!user) {
                await User.create(u);
                console.log(`✅ Centralized DB Init: Created ${u.role} account (${u.email})`);
            }
        }

        // 2. Ensure default OIML R-76 ruleset exists in Centralized MongoDB
        const defaultRules = {
            mpe: {
                class_I:   { e_intervals: [50000, 200000], mpe_e: [1, 2, 3] },
                class_II:  { e_intervals: [5000, 20000],   mpe_e: [1, 2, 3] },
                class_III: { e_intervals: [500, 2000],     mpe_e: [1, 2, 3] },
                class_IIII:{ e_intervals: [50, 200],       mpe_e: [1, 2, 3] }
            },
            tare: { mpe_multiplier: 1.0 },
            eccentricity: { load_fraction: 0.33 },
            repeatability: { max_diff_e: 1.0 },
            tilt: { limit_e: 1.0 },
            zero_setting: { limit_e: 0.25 }
        };

        const existingRule = await RuleSet.findOne({ version_name: "OIML R-76 V1" });
        if (!existingRule) {
            await RuleSet.create({
                version_name: "OIML R-76 V1",
                isActive: true,
                description: "Default OIML R-76-1:2006 (E) tolerances and limits.",
                rules: defaultRules,
                createdBy: "System"
            });
            console.log("✅ Centralized DB Init: Created OIML R-76 V1 ruleset");
        }
    } catch (err) {
        console.error("⚠️ Centralized DB initialization warning:", err.message);
    }
};

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_DB || "mongodb://127.0.0.1:27017/nawi_test_db";

    const db = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        bufferCommands: true,
    });
    cachedDb = db;
    console.log("✅ Connected to MongoDB");
    initializeDatabase().catch(err => console.error("DB Seed Error:", err));
    return cachedDb;
};

module.exports = connectDB;

