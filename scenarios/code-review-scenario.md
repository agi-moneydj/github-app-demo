# 場景 1: 程式碼審查 (Code Review) 觸發場景

## 觸發時機
創建 Pull Request 時自動觸發

## 問題代碼示例

### SQL 注入漏洞
```javascript
// 有問題的搜索端點 (server.js:95)
app.get('/api/search', (req, res) => {
  const searchTerm = req.query.q;
  // 危險：直接字串拼接，容易 SQL 注入
  const query = `SELECT * FROM tasks WHERE title LIKE '%${searchTerm}%'`;
  
  db.all(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});
```

### 硬編碼敏感資訊
```javascript
// 有問題的 JWT secret (server.js:9)
const JWT_SECRET = 'demo-secret-key'; // 不應該硬編碼
```

## 預期 Claude 回應
1. **安全漏洞識別**：
   - 檢測到 SQL 注入風險
   - 建議使用參數化查詢
   - 提供修復代碼範例

2. **程式碼品質建議**：
   - 建議使用環境變數儲存敏感資訊
   - 推薦更安全的認證方式

## 修復建議
```javascript
// 安全的搜索端點
app.get('/api/search', (req, res) => {
  const searchTerm = req.query.q;
  const query = 'SELECT * FROM tasks WHERE title LIKE ?';
  
  db.all(query, [`%${searchTerm}%`], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// 使用環境變數
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
```