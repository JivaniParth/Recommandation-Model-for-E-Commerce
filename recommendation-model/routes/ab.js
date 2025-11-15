const express = require("express");
const router = express.Router();
const abService = require("../services/abService");

// POST /api/ab/assign-all?models=1,2,3
// Bulk-assign all users to models (round-robin) — safe to run multiple times (skips existing assignments)
router.post("/assign-all", async (req, res) => {
  const modelsParam = req.query.models;
  let modelIds = [1, 2, 3];
  if (modelsParam) {
    modelIds = modelsParam
      .split(",")
      .map((s) => parseInt(s))
      .filter(Boolean);
  }

  try {
    const result = await abService.assignAllUsersEvenSplit(modelIds);
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error("assign-all failed", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/ab/user/:userId
// Returns the user's assigned model (and assigns one if missing)
router.get("/user/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (!userId) return res.status(400).json({ error: "invalid userId" });

  try {
    const assignment = await abService.getOrAssignUserModel(userId);
    return res.json({ ok: true, assignment });
  } catch (err) {
    console.error("getOrAssignUserModel failed", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
