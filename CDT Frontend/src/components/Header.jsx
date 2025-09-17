import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginForm from './LoginForm'

const Header = ({
  user,
  handleLogin,
  username,
  setUsername,
  password,
  setPassword,
  handleLogout
}) => {
  const [loginVisible, setLoginVisible] = useState(false)
  const navigate = useNavigate()

  const handleLogoutClick = () => {
    handleLogout()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header-logo">
        <Link to="/">
          <img src="/CDT_Logo_terra.svg" alt="Campus da Terra Library" />
        </Link>
      </div>
      <nav className="header-nav">
        <div className="nav-links">
          <Link to="/" className="nav-link">Library</Link>
          {user && (
            <Link to="/students" className="nav-link">Students</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/users" className="nav-link">Users</Link>
          )}
        </div>
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {!user ? (
          <>
            <button onClick={() => setLoginVisible(v => !v)}>Login</button>
            {loginVisible && (
  <div className="login-popup">
    <LoginForm
  handleLogin={handleLogin}
  username={username}
  setUsername={setUsername}
  password={password}
  setPassword={setPassword}
  onCancel={() => setLoginVisible(false)}
    />
  </div>
)}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <Link className="nav-link profile" to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>{user.name}</Link>
            <button onClick={handleLogoutClick}>Logout</button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header