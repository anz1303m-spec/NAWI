require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function seedUsers() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_DB || "mongodb://127.0.0.1:27017/nawi_test_db";
    try {
        await mongoose.connect(mongoUri);

        const usersToSeed = [
            {
                name: "Dr. Raman Kumar",
                email: "admin@schrodingersincident.com",
                password: "admin123",
                role: "admin"
            },
            {
                name: "Nishant",
                email: "tester@schrodingersincident.com",
                password: "tester123",
                role: "tester"
            },
            {
                name: "Quality Reviewer",
                email: "viewer@schrodingersincident.com",
                password: "viewer123",
                role: "viewer"
            }
        ];

        for (const u of usersToSeed) {
            let user = await User.findOne({ email: u.email });
            if (!user) {
                await User.create(u);
                console.log(`✅ Seeded ${u.role} User: ${u.email} / ${u.password}`);
            } else {
                user.name = u.name;
                user.password = u.password; // Triggers pre-save hook to hash password properly
                user.role = u.role;
                await user.save();
                console.log(`🔄 Reset & Updated ${u.role} User: ${u.email} / ${u.password}`);
            }
        }

    } catch (err) {
        console.error("❌ Error seeding users:", err.message);
    } finally {
        mongoose.connection.close();
    }
}

seedUsers();
