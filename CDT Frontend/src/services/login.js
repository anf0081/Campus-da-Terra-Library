import apiClient from '../utils/apiClient'

const login = async ({ username, password, rememberMe }) => {
  const response = await apiClient.post('/login', { username, password, rememberMe })
  return response.data
}

export default { login }