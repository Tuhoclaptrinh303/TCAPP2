const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8050;

app.use(cors());
app.use(bodyParser.json());

// Tạo connection pool thay vì single connection
const pool = mysql.createPool({
  port: process.env.MYSQL_ADDON_PORT || 3306,
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Kiểm tra kết nối
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Lỗi kết nối MySQL:", err);
    process.exit(1);
  }
  console.log("✅ Đã kết nối MySQL qua pool!");
  connection.release();
});

// Tạo bảng nếu chưa có
const createTable = `
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

pool.query(createTable, (err) => {
  if (err) console.error("❌ Lỗi tạo bảng:", err);
  else console.log("✅ Bảng transactions đã sẵn sàng.");
});

// API thêm giao dịch
app.post("/api/transactions", (req, res) => {
  const { date, name, type, amount, category, note } = req.body;
  const sql = `INSERT INTO transactions (date, name, type, amount, category, note) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  pool.query(sql, [date, name, type, amount, category, note], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ id: result.insertId });
  });
});

// API lấy giao dịch (có phân trang)
app.get("/api/transactions", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const sql = "SELECT * FROM transactions ORDER BY date DESC LIMIT ? OFFSET ?";
  pool.query(sql, [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

// API đếm tổng số giao dịch (hỗ trợ phân trang client)
app.get("/api/transactions/count", (req, res) => {
  pool.query("SELECT COUNT(*) as total FROM transactions", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ total: result[0].total });
  });
});

// API xóa giao dịch
app.delete("/api/transactions/:id", (req, res) => {
  const id = req.params.id;
  pool.query("DELETE FROM transactions WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Không tìm thấy giao dịch để xóa." });
    } else {
      res.json({ message: "Đã xóa thành công." });
    }
  });
});

// Khởi động server
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});
