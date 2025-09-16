import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Library from './components/Library'
import Students from './components/Students'
import Profile from './components/Profile'
import bookService from './services/books'
import loginService from './services/login'
import Notification from './components/Notification'

const App = () => {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [className, setClassName] = useState('error')

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedlibraryUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      bookService.setToken(user.token)
    }
  }, [])
  

  const handleLogin = async event => {
    event.preventDefault()
    try {
      const user = await loginService.login({ username, password })
      window.localStorage.setItem(
        'loggedlibraryUser', JSON.stringify(user)
      ) 
      
      bookService.setToken(user.token)
      setUser(user)
      setUsername('')
      setPassword('')
      bookService.setToken(user.token)
      setMessage('Login successful')
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch {
      setMessage('Wrong username or password')
      setTimeout(() => {
        setMessage(null)
      }, 5000)
    }
  }

  const handleLogout = () => {
    window.localStorage.removeItem('loggedlibraryUser')
    setUser(null)
    bookService.setToken(null)
    setMessage('Logged out successfully')
    setClassName('success')
    setTimeout(() => {
      setMessage(null)
      setClassName('error')
    }, 5000)
  }



  return (
    <Router>
      <div>
        <Header
          user={user}
          handleLogin={handleLogin}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          handleLogout={handleLogout}
        />
        <Notification message={message} type={className} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Library user={user} setMessage={setMessage} setClassName={setClassName} />} />
            <Route path="/students" element={<Students />} />
            <Route path="/profile" element={<Profile user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App