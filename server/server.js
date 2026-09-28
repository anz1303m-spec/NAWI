require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");
require("./config/cloudinary");

// Import Route Modules
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const photoRoutes = require("./routes/photoRoutes");
const viewerRoutes = require("./routes/viewerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ruleRoutes = require("./routes/ruleRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for React frontend (supports credentials for cookies/headers)
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

// Initialize DB connection
connectDB().catch(err => console.error("❌ Startup MongoDB Connection Error:", err.message));

// Mount API Routes
app.use("/api", authRoutes);
app.use("/api", reportRoutes);
app.use("/api", photoRoutes);
app.use("/api", viewerRoutes);
app.use("/api", adminRoutes);
app.use("/api", ruleRoutes);

app.get('/health',(req,res)=>{
   res.send("NAWI Server is Live ❄️ ")
}
)

// Serve static React build in production
if (process.env.NODE_ENV === "production") {
    const clientDist = path.join(__dirname, "../client/dist");
    app.use(express.static(clientDist));
    app.get("*", (req, res) => {
        res.sendFile(path.join(clientDist, "index.html"));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 NAWI Server running on http://localhost:${PORT}`);
});
