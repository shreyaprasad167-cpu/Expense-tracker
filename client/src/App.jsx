import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [date, setDate] = useState(() => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
});
  const [filterMonth, setFilterMonth] = useState("");

  // Load saved expenses from the server when the page opens.
  useEffect(() => {
    async function loadExpenses() {
      try {
        const response = await fetch("http://localhost:3000/api/expenses");
        if (!response.ok) throw new Error("Could not load expenses.");

        const data = await response.json();
        setExpenses(data);
      } catch {
        setError("Could not connect to the server. Is it running?");
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, []);

  async function addExpense(event) {
    event.preventDefault();
    setError("");

    if (!description.trim() || Number(amount) <= 0) {
      setError("Enter a description and an amount greater than zero.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount,category,date }),
      });

      const newExpense = await response.json();
      if (!response.ok) throw new Error(newExpense.error);

      setExpenses((current) => [newExpense, ...current]);
      setDescription("");
      setAmount("");
    } catch (err) {
      setError(err.message || "Could not save the expense.");
    }
  }

  async function deleteExpense(id) {
    setError("");

    try {
      const response = await fetch(
        `http://localhost:3000/api/expenses/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Could not delete the expense.");

      setExpenses((current) => current.filter((expense) => expense.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }
      const filteredExpenses = expenses.filter(
  (expense) =>
    (filterCategory === "All" || expense.category === filterCategory) &&
    (!filterMonth || expense.date?.startsWith(filterMonth))
);
   const total = filteredExpenses.reduce(
  (sum, expense) => sum + Number(expense.amount),
  0
);
const categoryTotals = ["Food", "Transport", "Shopping", "Bills", "Other"]
  .map((category) => ({
    category,
    amount: filteredExpenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + Number(expense.amount), 0),
  }))
  .filter((item) => item.amount > 0);
  const maxCategoryAmount = Math.max(
  ...categoryTotals.map((item) => item.amount),
  1
);
  return (
    <main className="app">
      <h1>Expense Tracker</h1>
      <p className="subtitle">Keep track of where your money goes.</p>

      {error && <p role="alert">{error}</p>}

      <section className="summary">
        <span>Total expenses</span>
        <strong>₹{total.toFixed(2)}</strong>
      </section>

      <form onSubmit={addExpense} className="expense-form">
        <label className="field-description">
          What did you spend on?
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="e.g. Lunch"
          />
        </label>

        <label className="field-category">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option>Food</option>
            <option>Transport</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Other</option>
          </select>
        </label>

        <label className="field-amount">
          Amount (₹)
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="e.g. 150"
          />
        </label>

        <label className="field-date">
          Date
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <button type="submit">Add expense</button>
      </form>

      <h2>Expenses</h2>
      <div className="filters">
        <select
          value={filterCategory}
          onChange={(event) => setFilterCategory(event.target.value)}
        >
          <option>All</option>
          <option>Food</option>
          <option>Transport</option>
          <option>Shopping</option>
          <option>Bills</option>
          <option>Other</option>
        </select>
        <input
          type="month"
          value={filterMonth}
          onChange={(event) => setFilterMonth(event.target.value)}
        />
      </div>
      {categoryTotals.length > 0 && (
  <section className="category-chart">
    <h3>Spending by category</h3>

    {categoryTotals.map((item) => (
      <div className="category-row" key={item.category}>
        <div className="category-label">
          <span>{item.category}</span>
          <strong>₹{item.amount.toFixed(2)}</strong>
        </div>

        <div className="bar-track">
          <div
            className="bar-fill"
            style={{ width: `${(item.amount / maxCategoryAmount) * 100}%` }}
          />
        </div>
      </div>
    ))}
  </section>
)}
      {loading ? (
        <p>Loading expenses…</p>
      ) : filteredExpenses.length=== 0 ? (
        <p className="empty">No expenses yet. Add your first one above.</p>
      ) : (
        <ul className="expense-list">
          {filteredExpenses.map((expense) => (
            <li key={expense.id}>
              <span>
  {expense.description}
  <br />
  <small>{expense.category || "Other"} · {expense.date}</small>
</span>
              
              <strong>₹{expense.amount.toFixed(2)}</strong>
              <button
                className="delete-button"
                onClick={() => deleteExpense(expense.id)}
                aria-label={`Delete ${expense.description}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default App;
