import { useState } from 'react'
import { Link } from 'react-router-dom'
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

  return (
    <header className="header">
      <div className="header-logo">
        <img src="./public/CDT_Logo_terra.svg" alt="Campus da Terra Library" />
      </div>
      <nav className="header-nav">
        {user && (
          <div className="nav-links">
            <Link to="/" className="nav-link">Library</Link>
            <Link to="/students" className="nav-link">Students</Link>
          </div>
        )}
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
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header