# 場景 5: 效能監控 (Performance Monitoring) 觸發場景

## 觸發時機
- 檢測到 N+1 查詢問題
- 發現未使用索引的查詢
- 同步操作阻塞事件循環
- 記憶體洩漏風險程式碼
- 回應時間超過閾值

## 效能問題示例

### 1. N+1 查詢問題
```javascript
// 問題：getTasksWithDetails 函數存在 N+1 查詢
async function getTasksWithDetails(userId) {
  // 1 次查詢獲取所有任務
  const tasks = await getUserTasks(userId);
  const taskDetails = [];
  
  // N 次查詢，每個任務都要查詢用戶資料
  for (let task of tasks) {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [task.user_id], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
    taskDetails.push({ ...task, user });
  }
  
  return taskDetails; // 總共 1 + N 次查詢
}
```

### 2. 缺少資料庫索引
```sql
-- 問題：搜索查詢沒有索引支援
SELECT * FROM tasks WHERE title LIKE '%keyword%'; -- 全表掃描

-- 問題：外鍵沒有索引
SELECT * FROM tasks WHERE user_id = 123; -- 可能很慢
```

### 3. 同步 I/O 阻塞
```javascript
// 問題：使用同步文件操作
const fs = require('fs');

app.post('/api/export', (req, res) => {
  const data = getTaskData();
  // 阻塞操作，會暫停整個事件循環
  fs.writeFileSync('./export.json', JSON.stringify(data));
  res.json({ message: 'Export completed' });
});
```

### 4. 記憶體洩漏風險
```javascript
// 問題：事件監聽器沒有清除
const eventHandlers = new Map();

app.post('/api/subscribe', (req, res) => {
  const userId = req.user.userId;
  const handler = (data) => {
    // 處理即時更新
  };
  
  eventHandlers.set(userId, handler);
  eventEmitter.on('taskUpdate', handler);
  // 忘記清除監聽器會導致記憶體洩漏
});
```

### 5. 未優化的查詢
```javascript
// 問題：不必要的資料傳輸
app.get('/api/tasks', (req, res) => {
  // 查詢所有欄位但只需要部分
  db.all('SELECT * FROM tasks WHERE user_id = ?', [userId], (err, tasks) => {
    // 傳送大量不需要的資料
    res.json(tasks);
  });
});
```

## 預期 Claude 效能建議

### 1. 優化 N+1 查詢
```javascript
// 解決方案：使用 JOIN 查詢
async function getTasksWithDetails(userId) {
  const query = `
    SELECT 
      t.*,
      u.id as user_id,
      u.username,
      u.email
    FROM tasks t
    JOIN users u ON t.user_id = u.id
    WHERE t.user_id = ?
  `;
  
  return await dbHelper.all(query, [userId]);
}

// 或使用批次查詢
async function getTasksWithDetailsBatch(userId) {
  const tasks = await dbHelper.all('SELECT * FROM tasks WHERE user_id = ?', [userId]);
  
  if (tasks.length === 0) return [];
  
  const userIds = [...new Set(tasks.map(task => task.user_id))];
  const users = await dbHelper.all(
    `SELECT * FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
    userIds
  );
  
  const userMap = new Map(users.map(user => [user.id, user]));
  
  return tasks.map(task => ({
    ...task,
    user: userMap.get(task.user_id)
  }));
}
```

### 2. 新增資料庫索引
```sql
-- 建議的索引
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_title ON tasks(title);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- 複合索引
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
```

### 3. 使用非同步操作
```javascript
// 解決方案：使用非同步 I/O
const fs = require('fs').promises;

app.post('/api/export', async (req, res) => {
  try {
    const data = await getTaskData();
    // 非阻塞操作
    await fs.writeFile('./export.json', JSON.stringify(data));
    res.json({ message: 'Export completed' });
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});
```

### 4. 記憶體洩漏預防
```javascript
// 解決方案：適當清除監聽器
const activeSubscriptions = new Map();

app.post('/api/subscribe', (req, res) => {
  const userId = req.user.userId;
  
  // 清除舊的訂閱
  if (activeSubscriptions.has(userId)) {
    const oldHandler = activeSubscriptions.get(userId);
    eventEmitter.removeListener('taskUpdate', oldHandler);
  }
  
  const handler = (data) => {
    // 處理即時更新
  };
  
  activeSubscriptions.set(userId, handler);
  eventEmitter.on('taskUpdate', handler);
  
  res.json({ message: 'Subscribed successfully' });
});

app.post('/api/unsubscribe', (req, res) => {
  const userId = req.user.userId;
  
  if (activeSubscriptions.has(userId)) {
    const handler = activeSubscriptions.get(userId);
    eventEmitter.removeListener('taskUpdate', handler);
    activeSubscriptions.delete(userId);
  }
  
  res.json({ message: 'Unsubscribed successfully' });
});
```

### 5. 查詢優化
```javascript
// 解決方案：選擇性查詢和分頁
app.get('/api/tasks', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const query = `
    SELECT 
      id, title, status, created_at
    FROM tasks 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, [userId, limit, offset], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: tasks.length === limit
      }
    });
  });
});
```

## 效能監控指標

### 1. 回應時間監控
```javascript
// 中介軟體：監控回應時間
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 1000) { // 超過 1 秒
      console.warn(`Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
    }
    
    // 記錄到監控系統
    recordMetric('response_time', responseTime, {
      method: req.method,
      path: req.path,
      status: res.statusCode
    });
  });
  
  next();
});
```

### 2. 資料庫查詢監控
```javascript
// 包裝資料庫操作以監控效能
const dbHelper = {
  async all(query, params) {
    const startTime = Date.now();
    try {
      const result = await new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      const queryTime = Date.now() - startTime;
      if (queryTime > 500) { // 超過 500ms
        console.warn(`Slow query: ${query} - ${queryTime}ms`);
      }
      
      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
};
```

## 觸發條件與警告

### 效能閾值
- **API 回應時間 > 1 秒**: 高優先級警告
- **資料庫查詢時間 > 500ms**: 中優先級警告
- **記憶體使用量增長 > 10MB/min**: 記憶體洩漏警告
- **同步操作檢測**: 立即警告

### Claude 建議優先級
1. **Critical**: 同步 I/O、記憶體洩漏
2. **High**: N+1 查詢、缺少索引
3. **Medium**: 查詢優化、快取策略
4. **Low**: 效能監控、日誌記錄