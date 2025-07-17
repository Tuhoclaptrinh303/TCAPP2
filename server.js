const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = 8050;

app.use(cors());
app.use(bodyParser.json());

// Kết nối database
const db = mysql.createConnection({
  port: 3308,
  host: "localhost",
  user: "root",
  password: "123456",
  database: "thuchi",
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ Đã kết nối MySQL!");
});

// API thêm giao dịch
app.post("/api/transactions", (req, res) => {
  const { date, name, type, amount, category, note } = req.body;
  const sql = "INSERT INTO transactions (date, name, type, amount, category, note) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [date, name, type, amount, category, note], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ id: result.insertId });
  });
});

// API lấy toàn bộ giao dịch
app.get("/api/transactions", (req, res) => {
  db.query("SELECT * FROM transactions ORDER BY date", (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

// XÓA một giao dịch theo ID
app.delete("/api/transactions/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const [result] = await db.promise().execute("DELETE FROM transactions WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Không tìm thấy giao dịch để xóa." });
    } else {
      res.json({ message: "Đã xóa thành công." });
    }
  } catch (error) {
    console.error("Lỗi khi xóa giao dịch:", error);
    res.status(500).json({ error: "Lỗi server khi xóa giao dịch." });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});
