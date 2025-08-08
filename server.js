const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'demo-secret-key';

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('tasks.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email],
      function(err) {
        if (err) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(201).json({ message: 'User created successfully', userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username } });
  });
});

app.get('/api/tasks', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all('SELECT * FROM tasks WHERE user_id = ?', [userId], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(tasks);
  });
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.userId;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  db.run(
    'INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)',
    [title, description, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ 
        message: 'Task created successfully', 
        taskId: this.lastID 
      });
    }
  );
});

app.get('/api/search', (req, res) => {
  const searchTerm = req.query.q;
  const query = `SELECT * FROM tasks WHERE title LIKE '%${searchTerm}%'`;
  
  db.all(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error ' });
    }
    res.json(results);
  });
});

function getUserTasks(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks WHERE user_id = ?', [userId], (err, tasks) => {
      if (err) reject(err);
      else resolve(tasks);
    });
  });
}

async function getTasksWithDetails(userId) {
  const tasks = await getUserTasks(userId);
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
  
  return taskDetails;
}

app.get('/api/tasks-with-details', authenticateToken, async (req, res) => {
  try {
    const tasks = await getTasksWithDetails(req.user.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});