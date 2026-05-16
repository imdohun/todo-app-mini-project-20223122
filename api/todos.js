const crypto = require('crypto')
const mongoose = require('mongoose')

const todoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

const Todo = mongoose.models.Todo || mongoose.model('Todo', todoSchema)

global.todosMemoryStore = global.todosMemoryStore || []
global.dbConnectionPromise = global.dbConnectionPromise || null
global.useMemoryStore = global.useMemoryStore || false

const connectDB = async () => {
  if (global.useMemoryStore) return false

  if (!process.env.MONGODB_URI) {
    global.useMemoryStore = true
    console.warn('MONGODB_URI is not set. Falling back to memory store.')
    return false
  }

  if (mongoose.connection.readyState === 1) return true

  try {
    global.dbConnectionPromise =
      global.dbConnectionPromise || mongoose.connect(process.env.MONGODB_URI)

    await global.dbConnectionPromise
    return true
  } catch (error) {
    global.dbConnectionPromise = null
    global.useMemoryStore = true
    console.warn(`MongoDB connection failed. Falling back to memory store: ${error.message}`)
    return false
  }
}

const createMemoryTodo = (title) => ({
  _id: crypto.randomUUID(),
  title,
  completed: false,
  createdAt: new Date().toISOString()
})

const handleMemoryStore = (req, res) => {
  const { method } = req
  const id = req.query.id

  if (method === 'GET' && !id) {
    return res.status(200).json(global.todosMemoryStore)
  }

  if (method === 'POST') {
    const title = req.body?.title?.trim()
    if (!title) return res.status(400).json({ error: 'Title is required' })

    const newTodo = createMemoryTodo(title)
    global.todosMemoryStore = [newTodo, ...global.todosMemoryStore]
    return res.status(201).json(newTodo)
  }

  if (method === 'PUT' && id) {
    const completed = Boolean(req.body?.completed)
    const todo = global.todosMemoryStore.find((item) => item._id === id)

    if (!todo) return res.status(404).json({ error: 'Todo not found' })

    todo.completed = completed
    return res.status(200).json(todo)
  }

  if (method === 'DELETE' && id) {
    const previousLength = global.todosMemoryStore.length
    global.todosMemoryStore = global.todosMemoryStore.filter((todo) => todo._id !== id)

    if (global.todosMemoryStore.length === previousLength) {
      return res.status(404).json({ error: 'Todo not found' })
    }

    return res.status(200).json({ message: 'Deleted' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const isDatabaseConnected = await connectDB()

    if (!isDatabaseConnected) {
      return handleMemoryStore(req, res)
    }

    const { method } = req
    const id = req.query.id

    if (method === 'GET' && !id) {
      const todos = await Todo.find().sort({ createdAt: -1 })
      return res.status(200).json(todos)
    }

    if (method === 'POST') {
      const title = req.body?.title?.trim()
      if (!title) return res.status(400).json({ error: 'Title is required' })

      const newTodo = await Todo.create({ title })
      return res.status(201).json(newTodo)
    }

    if (method === 'PUT' && id) {
      const todo = await Todo.findByIdAndUpdate(
        id,
        { completed: Boolean(req.body?.completed) },
        { new: true }
      )

      if (!todo) return res.status(404).json({ error: 'Todo not found' })
      return res.status(200).json(todo)
    }

    if (method === 'DELETE' && id) {
      const todo = await Todo.findByIdAndDelete(id)

      if (!todo) return res.status(404).json({ error: 'Todo not found' })
      return res.status(200).json({ message: 'Deleted' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
