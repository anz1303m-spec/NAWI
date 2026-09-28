require("dotenv").config();
const mongoose = require("mongoose");
const RuleSet = require("./models/RuleSet");

const defaultRules = {
    mpe: {
        class_I:   { e_intervals: [50000, 200000], mpe_e: [1, 2, 3] },
        class_II:  { e_intervals: [5000, 20000],   mpe_e: [1, 2, 3] },
        class_III: { e_intervals: [500, 2000],     mpe_e: [1, 2, 3] },
        class_IIII:{ e_intervals: [50, 200],       mpe_e: [1, 2, 3] }
    },
    tare: {
        mpe_multiplier: 1.0
    },
    eccentricity: {
        load_fraction: 0.33
    },
    repeatability: {
        max_diff_e: 1.0
    },
    tilt: {
        limit_e: 1.0
    },
    zero_setting: {
        limit_e: 0.25
    }
};

async function seed() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_DB || "mongodb://127.0.0.1:27017/nawi_test_db";
    try {
        await mongoose.connect(mongoUri);
        const existing = await RuleSet.findOne({ version_name: "OIML R-76 V1" });
        if (!existing) {
            const v1 = new RuleSet({
                version_name: "OIML R-76 V1",
                isActive: true,
                description: "Default OIML R-76-1:2006 (E) tolerances and limits.",
                rules: defaultRules,
                createdBy: "System"
            });
            await v1.save();
            console.log("✅ Seeded OIML R-76 V1 ruleset successfully.");
        } else {
            console.log("ℹ️ OIML R-76 V1 ruleset already exists.");
        }
    } catch (err) {
        console.error("❌ Seeding error:", err.message);
    } finally {
        mongoose.connection.close();
    }
}

seed();
