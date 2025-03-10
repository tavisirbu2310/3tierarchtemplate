const express = require("express");
const { Client } = require("pg");
const app = express();

// Retrieve database connection info from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 5432,
};

app.get("/api/message", async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query("SELECT message FROM messages LIMIT 1;");
    await client.end();
    if (result.rows.length > 0) {
      res.json({ message: result.rows[0].message });
    } else {
      res.json({ message: "No message found." });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error querying database", error: err.toString() });
  }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Node.js app tier is running!");
});

// Start the server on port 80
app.listen(80, () => {
  console.log("App is listening on port 80");
});
