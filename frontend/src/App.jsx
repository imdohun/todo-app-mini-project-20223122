import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || '/api/todos'

function App() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const res = await axios.get(API_URL)
      setTodos(res.data)
    } catch (err) {
      console.error('할 일 불러오기 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    try {
      const res = await axios.post(API_URL, { title: input })
      setTodos([res.data, ...todos])
      setInput('')
    } catch (err) {
      console.error('추가 실패:', err)
    }
  }

  const toggleTodo = async (id, completed) => {
    try {
      const res = await axios.put(`${API_URL}/${id}`, { completed: !completed })
      setTodos(todos.map(todo => todo._id === id ? res.data : todo))
    } catch (err) {
      console.error('수정 실패:', err)
    }
  }

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`)
      setTodos(todos.filter(todo => todo._id !== id))
    } catch (err) {
      console.error('삭제 실패:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center pt-16">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Todo List
        </h1>

        <form onSubmit={addTodo} className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="새로운 할 일을 입력하세요..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
          >
            추가
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-500">로딩 중...</p>
        ) : todos.length === 0 ? (
          <p className="text-center text-gray-400">할 일이 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li
                key={todo._id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo._id, todo.completed)}
                  className="w-5 h-5 accent-blue-500 cursor-pointer"
                />
                <span
                  className={`flex-1 ${
                    todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
                  }`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo._id)}
                  className="px-3 py-1 text-red-500 hover:bg-red-100 rounded transition"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-center text-gray-400 text-sm mt-6">
          총 {todos.length}개 | 완료 {todos.filter(t => t.completed).length}개
        </p>
      </div>
    </div>
  )
}

export default App
