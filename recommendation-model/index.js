require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Routes
const recommendations = require("./routes/recommendations");
app.use("/api/recommendations", recommendations);

// const products = require("./routes/products");
// app.use("/api/products", products);

// A/B testing routes
const abRoutes = require("./routes/ab");
app.use("/api/ab", abRoutes);

// Events (impression/click) routes
const eventsRoutes = require("./routes/events");
app.use("/api/events", eventsRoutes);

app.get("/", (req, res) => {
  res.send("Recommandation Model for E-Commerce — API root");
});

app.listen(port, () => {
  console.log(`Recommendation API listening on port ${port}`);
});
