const LoginForm = ({ handleLogin, username, setUsername, password, setPassword, onCancel }) => (
  <div>
    <h3>Login</h3>
    <form
      onSubmit={e => {
        handleLogin(e)
        if (onCancel) onCancel()
      }}
    >
      <div>
        <label>
          Username:
          <input
            id="username"
            type="text"
            value={username}
            onChange={({ target }) => setUsername(target.value)}
            autoComplete="username"
          />
        </label>
      </div>
      <div>
        <label>
          Password:
          <input
            id="password"
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            autoComplete="current-password"
          />
        </label>
      </div>
      <div className="login-popup-actions">
        <button type="submit">Login</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  </div>
)

export default LoginForm