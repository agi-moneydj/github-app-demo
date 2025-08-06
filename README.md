# GitHub App Demo - TaskManager API

A demonstration project showcasing Claude GitHub App's intelligent code collaboration features.

## 🎯 Project Overview

This Node.js/Express API serves as a hands-on lab for demonstrating how Claude GitHub App can:

- **Automatically review code** for security vulnerabilities and best practices
- **Generate documentation** including README files and API documentation  
- **Scan for security issues** following OWASP standards
- **Suggest refactoring** to improve code quality and maintainability
- **Monitor performance** and identify optimization opportunities

## 🚀 Features

- User registration and authentication with JWT
- Task management (CRUD operations)
- SQLite database integration
- RESTful API design
- Deliberately includes common issues for demonstration purposes

## 📋 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Tasks
- `GET /api/tasks` - Get user's tasks (requires authentication)
- `POST /api/tasks` - Create new task (requires authentication)
- `GET /api/tasks-with-details` - Get tasks with user details (requires authentication)

### Search
- `GET /api/search` - Search tasks by title

## 🛠️ Installation

```bash
npm install
npm start
```

The server will run on `http://localhost:3000`

## 🧪 Hands-on Lab

This project is designed for a 15-minute hands-on lab demonstrating Claude GitHub App capabilities. See [HANDS-ON-LAB-GUIDE.md](./HANDS-ON-LAB-GUIDE.md) for detailed instructions.

### Lab Scenarios
1. **Code Review** - SQL injection detection and security analysis
2. **Documentation Generation** - Automatic README and API docs creation
3. **Security Scanning** - OWASP compliance and vulnerability assessment
4. **Refactoring Suggestions** - Code smell detection and improvement recommendations
5. **Performance Monitoring** - N+1 query detection and optimization suggestions

## 🔍 Intentional Issues (for demonstration)

This codebase intentionally contains several issues to showcase Claude's analysis capabilities:

- SQL injection vulnerabilities
- Hardcoded secrets
- Weak password hashing settings
- Code duplication
- N+1 query problems
- Missing input validation
- Performance bottlenecks

## 📚 Educational Use

This project is designed for educational purposes to demonstrate:
- Common security vulnerabilities and how to fix them
- Best practices in Node.js/Express development
- The value of automated code analysis tools
- How AI can assist in code quality improvement

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your own educational purposes.

## 📄 License

MIT License - See LICENSE file for details.

---

**🤖 Enhanced by Claude GitHub App** - Intelligent code collaboration for better software development.