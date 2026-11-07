const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("node:path");

const app = express();
const db = new Database(path.join(__dirname, "expenses.db"));

app.use(cors());
app.use(express.json());

// Create the expenses table if it doesn't exist yet.
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL
  )
`);
const columns = db.prepare("PRAGMA table_info(expenses)").all();

if (!columns.some((column) => column.name === "category")) {
  db.exec("ALTER TABLE expenses ADD COLUMN category TEXT NOT NULL DEFAULT 'Other'");
}
if (!columns.some((column) => column.name === "date")) {
  db.exec("ALTER TABLE expenses ADD COLUMN date TEXT");
}
// Send all saved expenses to whoever asks.
app.get("/api/expenses", (req, res) => {
  const expenses = db.prepare("SELECT * FROM expenses ORDER BY id DESC").all();
  res.json(expenses);
});

// Save one new expense.
app.post("/api/expenses", (req, res) => {
  const { description, amount } = req.body || {};
  const date = req.body.date || new Date().toISOString().slice(0, 10); 
  if (!description?.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Enter a description and an amount greater than zero." });
  }

  const result = db
    .prepare(
  "INSERT INTO expenses (description, amount, category,date) VALUES (?, ?, ? ,?)"
)
    .run(description.trim(), Number(amount), req.body.category || "Other" ,date); 

  const expense = db
    .prepare("SELECT * FROM expenses WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(expense);
});

// Delete one expense by its ID.
app.delete("/api/expenses/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM expenses WHERE id = ?")
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Expense not found." });
  }

  res.sendStatus(204);
});

app.listen(3000, () => {
  console.log("Expense server running at http://localhost:3000");
});