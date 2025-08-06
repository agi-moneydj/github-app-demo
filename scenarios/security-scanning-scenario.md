# 場景 3: 安全漏洞掃描 (Security Vulnerability Scanning) 觸發場景

## 觸發時機
- 依賴套件更新
- Push 包含安全敏感程式碼
- 定期自動安全掃描
- Pull Request 包含認證或資料庫相關程式碼

## 安全問題示例

### 1. 弱密碼雜湊設定
```javascript
// 問題：bcrypt 輪數太低，容易被破解
const hashedPassword = await bcrypt.hash(password, 1); // 應該至少 10 輪
```

### 2. JWT Secret 管理
```javascript
// 問題：硬編碼 secret，且過於簡單
const JWT_SECRET = 'demo-secret-key'; 
```

### 3. 缺少輸入驗證
```javascript
// 問題：沒有驗證用戶輸入
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  // 直接使用未驗證的輸入
});
```

### 4. 過時依賴套件
```json
{
  "dependencies": {
    "express": "^4.17.1",     // 過時版本
    "jsonwebtoken": "^8.5.1", // 有已知漏洞
    "sqlite3": "^5.0.2"       // 舊版本
  }
}
```

### 5. 敏感資訊洩露
```javascript
// 問題：錯誤訊息洩露系統資訊
app.use((err, req, res, next) => {
  res.status(500).json({ 
    error: err.message,    // 可能洩露系統資訊
    stack: err.stack       // 洩露程式碼結構
  });
});
```

## 預期 Claude 安全建議

### 1. OWASP Top 10 檢查
- **A01: Broken Access Control** - 檢查認證機制
- **A02: Cryptographic Failures** - 檢查加密實作
- **A03: Injection** - 檢查 SQL 注入風險
- **A07: Identification Failures** - 檢查認證漏洞
- **A09: Security Logging** - 檢查日誌記錄

### 2. 具體修復建議
```javascript
// 安全的密碼雜湊
const hashedPassword = await bcrypt.hash(password, 12);

// 環境變數管理
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// 輸入驗證
const validateRegistration = (req, res, next) => {
  const { username, password, email } = req.body;
  
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  next();
};

// 安全錯誤處理
app.use((err, req, res, next) => {
  console.error('Error:', err); // 記錄到伺服器日誌
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: err.message });
  }
});
```

### 3. 依賴安全更新建議
```json
{
  "dependencies": {
    "express": "^4.18.2",     // 更新到最新安全版本
    "jsonwebtoken": "^9.0.0", // 修復已知漏洞
    "sqlite3": "^5.1.6",      // 最新穩定版本
    "helmet": "^7.0.0",       // 新增安全標頭
    "express-rate-limit": "^6.7.0" // 新增速率限制
  }
}
```

## 觸發條件
1. 偵測到弱加密演算法
2. 發現硬編碼敏感資訊
3. 識別過時的依賴套件
4. 檢測到缺少安全驗證
5. 發現潛在的資訊洩露風險

## Claude 安全評分
- **嚴重 (Critical)**: SQL 注入、硬編碼密鑰
- **高 (High)**: 弱密碼雜湊、過時依賴
- **中 (Medium)**: 缺少輸入驗證、錯誤處理
- **低 (Low)**: 缺少安全標頭、日誌記錄