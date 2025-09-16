const LoginForm = ({ handleLogin, username, setUsername, password, setPassword }) => (
  <div>
    <h2>Login</h2>
    <form onSubmit={handleLogin}>
      <div>
        <label>
          Username: &nbsp;
          <input
            id="username"
            type="text"
            value={username}
            onChange={({ target }) => setUsername(target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Password: &nbsp;
          <input
            id="password"
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
          />
        </label>
      </div>
      <button type="submit">login</button>
    </form>
  </div>
)

export default LoginForm