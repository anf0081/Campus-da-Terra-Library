import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Library from './components/Library'
import Students from './components/Students'
import Users from './components/Users'
import Profile from './components/Profile'
import StudentDashboard from './components/StudentDashboard'
import bookService from './services/books'
import loginService from './services/login'
import userService from './services/users'
import studentService from './services/students'
import dashboardService from './services/dashboards'
import Notification from './components/Notification'
import { setOnTokenExpiredCallback } from './utils/apiClient'

const App = () => {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [message, setMessage] = useState(null)
  const [className, setClassName] = useState('error')

  const handleLogout = useCallback((message = 'Logged out successfully') => {
    window.localStorage.removeItem('loggedlibraryUser')
    setUser(null)
    bookService.setToken(null)
    userService.setToken(null)
    studentService.setToken(null)
    dashboardService.setToken(null)
    setMessage(message)
    setClassName('success')
    setTimeout(() => {
      setMessage(null)
      setClassName('error')
    }, 5000)
  }, [])

  const handleTokenExpired = useCallback(() => {
    handleLogout('Your session has expired. Please log in again.')
  }, [handleLogout])

  useEffect(() => {
    setOnTokenExpiredCallback(handleTokenExpired)

    const loggedUserJSON = window.localStorage.getItem('loggedlibraryUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      console.log('Setting token on page load:', user.token ? 'Token exists' : 'No token')
      setUser(user)
      bookService.setToken(user.token)
      userService.setToken(user.token)
      studentService.setToken(user.token)
      dashboardService.setToken(user.token)
    }
  }, [handleTokenExpired])
  

  const handleLogin = async event => {
    event.preventDefault()
    try {
      const user = await loginService.login({ username, password, rememberMe })
      window.localStorage.setItem(
        'loggedlibraryUser', JSON.stringify(user)
      )

      bookService.setToken(user.token)
      userService.setToken(user.token)
      studentService.setToken(user.token)
      dashboardService.setToken(user.token)
      setUser(user)
      setUsername('')
      setPassword('')
      setRememberMe(false)
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
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
          handleLogout={handleLogout}
        />
        <Notification message={message} type={className} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Library user={user} setMessage={setMessage} setClassName={setClassName} />} />
            <Route path="/students" element={<Students user={user} setMessage={setMessage} setClassName={setClassName} />} />
            <Route path="/dashboard/:studentId" element={<StudentDashboard user={user} setMessage={setMessage} setClassName={setClassName} />} />
            <Route path="/users" element={<Users user={user} setMessage={setMessage} setClassName={setClassName} />} />
            <Route path="/profile" element={<Profile user={user} setUser={setUser} setMessage={setMessage} setClassName={setClassName} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App