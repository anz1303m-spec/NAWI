const RuleSet = require("../models/RuleSet");

const getActiveRule = async (req, res) => {
    try {
        let activeRule = await RuleSet.findOne({ isActive: true });
        if (!activeRule) {
            activeRule = await RuleSet.findOne({ version_name: "OIML R-76 V1" });
        }
        res.json(activeRule || {});
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getActiveRule
};
