import axios from 'axios'
const baseUrl = '/api/login'

const login = async ({ username, password, rememberMe }) => {
  const response = await axios.post(baseUrl, { username, password, rememberMe })
  return response.data
}

export default { login }