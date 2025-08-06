# 場景 4: 重構建議 (Refactoring Suggestions) 觸發場景

## 觸發時機
- 程式碼複雜度過高
- 重複程式碼達到閾值
- 函數過長或參數過多
- 程式碼異味 (Code Smells) 檢測

## 程式碼異味示例

### 1. 重複程式碼 (Duplicated Code)
```javascript
// 問題：重複的資料庫操作模式
app.post('/api/register', async (req, res) => {
  // 重複的錯誤處理
  db.run(query, params, function(err) {
    if (err) {
      return res.status(400).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Success', id: this.lastID });
  });
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  // 相同的錯誤處理模式
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Success', taskId: this.lastID });
  });
});
```

### 2. 長函數 (Long Method)
```javascript
// 問題：函數過長，職責不清
app.get('/api/tasks-with-details', authenticateToken, async (req, res) => {
  try {
    // 步驟 1: 獲取任務
    const tasks = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM tasks WHERE user_id = ?', [req.user.userId], (err, tasks) => {
        if (err) reject(err);
        else resolve(tasks);
      });
    });
    
    // 步驟 2: 獲取詳細資訊
    const taskDetails = [];
    for (let task of tasks) {
      const user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [task.user_id], (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      });
      taskDetails.push({ ...task, user });
    }
    
    // 步驟 3: 格式化回應
    const formattedTasks = taskDetails.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.created_at,
      author: {
        id: task.user.id,
        username: task.user.username
      }
    }));
    
    res.json(formattedTasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

### 3. 神奇數字 (Magic Numbers)
```javascript
// 問題：硬編碼的數字缺乏意義
const hashedPassword = await bcrypt.hash(password, 10); // 10 是什麼？
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 }); // 3600 秒？
```

### 4. 長參數列表 (Long Parameter List)
```javascript
// 問題：參數過多
function createTask(title, description, status, priority, assigneeId, projectId, dueDate, tags) {
  // 實作...
}
```

## 預期 Claude 重構建議

### 1. 提取公用函數
```javascript
// 重構：提取資料庫操作助手
const dbHelper = {
  run: (query, params) => {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  
  get: (query, params) => {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (query, params) => {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};
```

### 2. 拆分長函數
```javascript
// 重構：將長函數分解為小函數
class TaskService {
  async getUserTasks(userId) {
    return await dbHelper.all('SELECT * FROM tasks WHERE user_id = ?', [userId]);
  }
  
  async enrichTaskWithUser(task) {
    const user = await dbHelper.get('SELECT * FROM users WHERE id = ?', [task.user_id]);
    return { ...task, user };
  }
  
  formatTaskForResponse(task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.created_at,
      author: {
        id: task.user.id,
        username: task.user.username
      }
    };
  }
  
  async getTasksWithDetails(userId) {
    const tasks = await this.getUserTasks(userId);
    const enrichedTasks = await Promise.all(
      tasks.map(task => this.enrichTaskWithUser(task))
    );
    return enrichedTasks.map(task => this.formatTaskForResponse(task));
  }
}

// 簡化的端點
app.get('/api/tasks-with-details', authenticateToken, async (req, res) => {
  try {
    const taskService = new TaskService();
    const tasks = await taskService.getTasksWithDetails(req.user.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

### 3. 使用常數取代神奇數字
```javascript
// 重構：定義有意義的常數
const CONFIG = {
  BCRYPT_ROUNDS: 12,
  JWT_EXPIRES_IN: 24 * 60 * 60, // 24 小時 (秒)
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8
};

const hashedPassword = await bcrypt.hash(password, CONFIG.BCRYPT_ROUNDS);
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: CONFIG.JWT_EXPIRES_IN });
```

### 4. 使用物件參數
```javascript
// 重構：使用物件參數取代長參數列表
function createTask(taskData) {
  const {
    title,
    description,
    status = 'pending',
    priority = 'medium',
    assigneeId,
    projectId,
    dueDate,
    tags = []
  } = taskData;
  
  // 實作...
}

// 使用方式
createTask({
  title: 'New Task',
  description: 'Task description',
  assigneeId: 123,
  dueDate: '2024-01-01'
});
```

## 觸發條件與建議

### 複雜度指標
- **圈複雜度 > 10**: 建議拆分函數
- **函數長度 > 50 行**: 建議重構
- **重複程式碼 > 6 行**: 建議提取公用函數
- **參數個數 > 5**: 建議使用物件參數

### Claude 重構優先級
1. **高優先級**: 安全相關重構、效能瓶頸
2. **中優先級**: 程式碼重複、長函數
3. **低優先級**: 命名改善、程式碼風格

### 重構安全性
- 確保重構不改變程式行為
- 提供單元測試建議
- 漸進式重構策略
- 向下相容性考慮