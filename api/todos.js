const mongoose = require('mongoose');

// MongoDB 연결
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

// Todo 스키마 & 모델
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Todo = mongoose.model('Todo', todoSchema);

module.exports = async (req, res) => {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    const { method } = req;
    const id = req.query.id;

    // 전체 목록 조회
    if (method === 'GET' && !id) {
      const todos = await Todo.find().sort({ createdAt: -1 });
      return res.status(200).json(todos);
    }

    // Todo 추가
    if (method === 'POST') {
      const { title } = req.body;
      if (!title) return res.status(400).json({ error: '제목이 필요합니다' });
      const newTodo = new Todo({ title });
      await newTodo.save();
      return res.status(201).json(newTodo);
    }

    // Todo 수정
    if (method === 'PUT' && id) {
      const { completed } = req.body;
      const todo = await Todo.findByIdAndUpdate(id, { completed }, { new: true });
      if (!todo) return res.status(404).json({ error: 'Todo를 찾을 수 없습니다' });
      return res.status(200).json(todo);
    }

    // Todo 삭제
    if (method === 'DELETE' && id) {
      const todo = await Todo.findByIdAndDelete(id);
      if (!todo) return res.status(404).json({ error: 'Todo를 찾을 수 없습니다' });
      return res.status(200).json({ message: '삭제 완료' });
    }

    return res.status(405).json({ error: '지원하지 않는 메서드입니다' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
