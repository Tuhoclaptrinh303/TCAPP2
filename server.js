const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8050;

app.use(cors());
app.use(bodyParser.json());

// Kết nối database
const db = mysql.createConnection({
  port: process.env.MYSQL_ADDON_PORT || 3306,
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ Đã kết nối MySQL!");
});

const createTableIfNotExists = `
CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  name VARCHAR(255),
  type VARCHAR(50),
  amount DECIMAL(15,2) NOT NULL,
  category VARCHAR(50),
  note TEXT
);
`;

db.query(createTableIfNotExists, (err) => {
  if (err) {
    console.error("Lỗi tạo bảng:", err);
  } else {
    console.log("✅ Bảng transactions đã sẵn sàng.");
  }
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
