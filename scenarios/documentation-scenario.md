# 場景 2: 文件生成 (Documentation Generation) 觸發場景

## 觸發時機
- Push 到 main branch
- 新增或修改 API 端點
- 缺少 README 或 API 文件時

## 缺失文件示例

### 當前狀態
專案缺少以下文件：
- README.md
- API 文檔
- 程式碼註解不完整

## 預期 Claude 自動生成

### 1. README.md
```markdown
# TaskManager API Demo

一個簡單的任務管理 API，用於展示 GitHub App 功能。

## 功能特色
- 用戶註冊與登入
- JWT 認證
- 任務 CRUD 操作
- 搜索功能

## 安裝與執行
```bash
npm install
npm start
```

## API 端點
詳見 [API 文檔](./docs/api.md)
```

### 2. API 文檔 (docs/api.md)
```markdown
# API 文檔

## 認證端點

### POST /api/register
註冊新用戶

**請求體：**
```json
{
  "username": "string",
  "password": "string", 
  "email": "string"
}
```

**回應：**
```json
{
  "message": "User created successfully",
  "userId": 1
}
```

### POST /api/login
用戶登入

### GET /api/tasks
獲取用戶任務列表（需要認證）

### POST /api/tasks  
創建新任務（需要認證）
```

### 3. 程式碼註解補充
```javascript
/**
 * 用戶認證中介軟體
 * @param {Request} req - Express 請求對象
 * @param {Response} res - Express 回應對象  
 * @param {Function} next - 下一個中介軟體函數
 */
function authenticateToken(req, res, next) {
  // 實作內容...
}

/**
 * 獲取用戶任務並包含詳細資訊
 * @param {number} userId - 用戶 ID
 * @returns {Promise<Array>} 包含詳細資訊的任務陣列
 */
async function getTasksWithDetails(userId) {
  // 實作內容...
}
```

## 觸發條件
1. 檢測到新的 API 端點但缺少文檔
2. 專案沒有 README.md
3. 函數缺少適當的註解
4. Push 到 main branch 時自動更新文檔

## Claude 建議格式
- 使用 JSDoc 標準註解
- Markdown 格式文檔
- 包含請求/回應範例
- 提供安裝與使用說明