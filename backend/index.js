require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB 연결 (서버리스 환경 대응)
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');
  } catch (err) {
    console.log('❌ MongoDB 연결 실패:', err.message);
  }
};

// 모든 요청 전에 DB 연결 확인
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Todo 스키마 & 모델
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Todo = mongoose.model('Todo', todoSchema);

// API 엔드포인트
// 전체 목록 조회
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Todo 추가
app.post('/api/todos', async (req, res) => {
  try {
    const newTodo = new Todo({ title: req.body.title });
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Todo 완료 체크 토글
app.put('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { completed: req.body.completed },
      { new: true }
    );
    if (!todo) return res.status(404).json({ error: 'Todo를 찾을 수 없습니다' });
    res.json(todo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Todo 삭제
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ error: 'Todo를 찾을 수 없습니다' });
    res.json({ message: '삭제 완료' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 서버 실행 (로컬 개발용)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 서버 실행 중: http://localhost:${PORT}`));
}

// Vercel 서버리스용 export
module.exports = app;
