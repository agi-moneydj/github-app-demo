# GitHub App Hands-on Lab 指南
**展示 Claude GitHub App 的智能程式碼協作功能 (15分鐘)**

## 🎯 實驗目標
展示安裝 GitHub App 後，Claude 如何自動分析程式碼並提供：
- 程式碼審查建議
- 文件自動生成
- 安全漏洞掃描
- 重構建議
- 效能優化建議

## ⏱️ 時間分配 (15分鐘)

| 階段 | 時間 | 內容 |
|------|------|------|
| **準備** | 3分鐘 | GitHub App 安裝與專案設定 |
| **場景1** | 2分鐘 | 程式碼審查 - SQL 注入檢測 |
| **場景2** | 2分鐘 | 文件生成 - README 與 API 文檔 |
| **場景3** | 3分鐘 | 安全掃描 - OWASP 安全檢查 |
| **場景4** | 3分鐘 | 重構建議 - 程式碼異味檢測 |
| **場景5** | 2分鐘 | 效能監控 - N+1 查詢優化 |

## 🚀 準備階段 (3分鐘)

### 步驟 1: 安裝 GitHub App (一次性設定)
```bash
# 在 Claude Code 中執行 (每個 GitHub 帳號只需執行一次)
/install-github-app
```
**注意**: `/install-github-app` 是針對 GitHub 帳號的一次性設定，安裝後該帳號下的所有 repositories 都可以使用 Claude GitHub App 功能。

### 步驟 2: 建立示範專案 (多種方式)

#### 方式 A: 使用自然語言請 Claude 處理
```
請幫我從 https://github.com/agi-moneydj/github-app-demo 
fork 一個 repository 到我的 GitHub 帳號，並 clone 到本地
```

#### 方式 B: 使用 GitHub CLI 命令
```bash
# Fork repository 到你的帳號
gh repo fork https://github.com/agi-moneydj/github-app-demo

# Clone 到本地
gh repo clone YOUR_USERNAME/github-app-demo
cd github-app-demo
```

#### 方式 C: 傳統 Git 命令
```bash
# 先在 GitHub 網頁上 fork https://github.com/agi-moneydj/github-app-demo
# 然後 clone 你 fork 的版本
git clone https://github.com/YOUR_USERNAME/github-app-demo
cd github-app-demo
```

**建議**: 使用方式 A，讓 Claude 自動處理所有步驟！

### 步驟 3: 檢查專案結構
```
taskmanager-api-demo/
├── server.js          # 主應用程式（包含問題代碼）
├── package.json       # 依賴套件
├── scenarios/         # 各場景說明
└── HANDS-ON-LAB-GUIDE.md
```

## 🔍 場景展示

### 場景 1: 程式碼審查 (2分鐘)

**觸發方式**: 建立包含安全漏洞的 Pull Request

**展示步驟**:
1. 建立新分支 `feature/search-api`
2. 修改 `server.js` 的搜索功能（故意加入 SQL 注入漏洞）
3. 創建 Pull Request

**問題代碼**:
```javascript
// SQL 注入漏洞 (server.js:95)
app.get('/api/search', (req, res) => {
  const searchTerm = req.query.q;
  const query = `SELECT * FROM tasks WHERE title LIKE '%${searchTerm}%'`;
  // ⚠️ 危險：直接字串拼接
});
```

**預期 Claude 回應**:
- ✅ 檢測到 SQL 注入風險
- ✅ 建議使用參數化查詢
- ✅ 提供修復代碼範例
- ✅ 安全等級評分：**Critical**

### 場景 2: 文件生成 (2分鐘)

**觸發方式**: Push 新代碼到 main branch，但缺少文檔

**展示步驟**:
1. 合併 PR 到 main branch
2. 專案缺少 README.md 和 API 文檔

**預期 Claude 自動生成**:
- ✅ 完整的 README.md
- ✅ API 端點文檔
- ✅ 安裝與使用說明
- ✅ 程式碼註解補充

**生成示例**:
```markdown
# TaskManager API Demo

## API 端點
- POST /api/register - 用戶註冊
- POST /api/login - 用戶登入
- GET /api/tasks - 獲取任務列表
```

### 場景 3: 安全漏洞掃描 (3分鐘)

**觸發方式**: 安全敏感程式碼變更或依賴更新

**展示問題**:
```javascript
// 1. 弱密碼雜湊
const hashedPassword = await bcrypt.hash(password, 1); // 太低

// 2. 硬編碼 Secret
const JWT_SECRET = 'demo-secret-key';

// 3. 缺少輸入驗證
const { username, password } = req.body; // 直接使用
```

**預期 Claude 安全報告**:
- 🔴 **Critical**: 硬編碼敏感資訊
- 🟠 **High**: 弱加密參數
- 🟡 **Medium**: 缺少輸入驗證
- ✅ OWASP Top 10 合規檢查
- ✅ 依賴漏洞掃描

### 場景 4: 重構建議 (3分鐘)

**觸發方式**: 檢測到程式碼異味

**展示問題**:
```javascript
// 1. 重複程式碼
app.post('/api/register', async (req, res) => {
  db.run(query, params, function(err) {
    if (err) return res.status(400).json({ error: 'Database error' });
    res.status(201).json({ message: 'Success' });
  });
});

// 2. 長函數 (50+ 行)
app.get('/api/tasks-with-details', authenticateToken, async (req, res) => {
  // 複雜的多步驟邏輯...
});
```

**預期 Claude 重構建議**:
- ✅ 提取公用 database helper
- ✅ 拆分長函數為小模組
- ✅ 使用 Service 類別模式
- ✅ 程式碼複雜度分析
- ✅ 重構優先級排序

### 場景 5: 效能監控 (2分鐘)

**觸發方式**: 檢測到效能問題

**展示問題**:
```javascript
// N+1 查詢問題
async function getTasksWithDetails(userId) {
  const tasks = await getUserTasks(userId);    // 1 次查詢
  
  for (let task of tasks) {
    const user = await getUser(task.user_id);  // N 次查詢
    // ...
  }
}
```

**預期 Claude 效能建議**:
- ✅ 識別 N+1 查詢問題
- ✅ 建議使用 JOIN 查詢
- ✅ 推薦建立資料庫索引
- ✅ 效能優化程式碼範例

## 📊 展示成果總覽

### 自動檢測到的問題統計
| 類別 | 檢測數量 | Critical | High | Medium | Low |
|------|----------|----------|------|--------|-----|
| 安全漏洞 | 5個 | 2個 | 2個 | 1個 | 0個 |
| 程式碼品質 | 8個 | 0個 | 3個 | 3個 | 2個 |
| 效能問題 | 3個 | 1個 | 1個 | 1個 | 0個 |
| 文檔缺失 | 4個 | 0個 | 2個 | 2個 | 0個 |

### Claude 提供的解決方案
- ✅ **20+ 具體程式碼修復建議**
- ✅ **完整的安全最佳實務指南**
- ✅ **自動生成的技術文檔**
- ✅ **效能優化實作範例**

## 🎯 關鍵展示要點

### 1. 觸發時機的多樣性
- **Pull Request 創建** → 程式碼審查
- **Push to main** → 文件更新
- **依賴變更** → 安全掃描
- **程式碼複雜度** → 重構建議
- **效能問題** → 優化建議

### 2. Claude 的智能分析能力
- **上下文理解**: 根據專案架構提供適當建議
- **安全意識**: 遵循 OWASP 安全標準
- **最佳實務**: 業界標準程式碼規範
- **效能考量**: 實際可執行的優化方案

### 3. 開發工作流整合
- **無縫整合**: 不改變現有開發流程
- **即時回饋**: PR 中直接顯示建議
- **自動化**: 減少手動檢查工作
- **學習性**: 幫助團隊提升技能

## 🚀 實際使用建議

### 團隊導入策略
1. **漸進式啟用**: 先啟用程式碼審查功能
2. **團隊培訓**: 了解 Claude 建議的意義
3. **規則客製**: 根據團隊標準調整檢查規則
4. **持續改進**: 根據使用回饋優化設定

### 最大化效益
- 將 Claude 建議納入 Code Review 流程
- 建立基於 Claude 建議的編碼規範
- 定期檢視 Claude 識別的模式問題
- 使用 Claude 生成的文檔作為知識管理

## 🎉 總結

GitHub App 讓 Claude 成為您開發團隊的智能程式碼夥伴，提供：

- **🔍 全面的程式碼分析** - 安全、品質、效能一次到位
- **📚 自動化文檔管理** - 讓文檔始終保持最新
- **🛡️ 主動安全防護** - 在問題進入生產前攔截
- **⚡ 效能優化指導** - 基於實際程式碼的具體建議
- **🔧 智能重構建議** - 幫助程式碼持續改進

**立即安裝 GitHub App，讓 Claude 成為您最強的開發助手！**