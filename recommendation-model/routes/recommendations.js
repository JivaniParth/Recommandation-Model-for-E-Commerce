const express = require("express");
const router = express.Router();
const neo4jService = require("../services/neo4jService");
const pgService = require("../services/postgresService");
const abService = require("../services/abService");

// GET /api/recommendations/:userId?model=graph|collab|content&limit=10
router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  // If `model` query param provided, use it. Otherwise consult A/B assignment for this user.
  let model = req.query.model ? req.query.model.toLowerCase() : null;
  const limit = parseInt(req.query.limit) || 10;

  try {
    if (!model) {
      // get or assign model for the user
      const assignment = await abService.getOrAssignUserModel(userId);
      model = (assignment.model_name || "graph").toLowerCase();
    }

    // Normalize model name (handle both "collaborative" and "collab")
    if (model === "collaborative") {
      model = "collab";
    }

    if (model === "graph") {
      const recs = await neo4jService.getGraphRecommendations(userId, limit);
      return res.json({ model: "graph", recommendations: recs });
    }

    if (model === "collab") {
      const recs = await pgService.getCollaborativeRecommendations(
        userId,
        limit
      );
      return res.json({ model: "collab", recommendations: recs });
    }

    if (model === "content") {
      const recs = await pgService.getContentRecommendations(userId, limit);
      return res.json({ model: "content", recommendations: recs });
    }

    return res
      .status(400)
      .json({
        error: "Unknown model (graph|collab|content|collaborative) expected",
      });
  } catch (err) {
    console.error("Recommendation error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
