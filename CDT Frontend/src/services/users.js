import apiClient, { setToken } from '../utils/apiClient'

const getAll = async () => {
  const response = await apiClient.get('/users')
  return response.data
}

const update = async (id, profileData) => {
  const response = await apiClient.put(`/users/${id}`, profileData)
  return response.data
}

const create = async (userData) => {
  const response = await apiClient.post('/users', userData)
  return response.data
}

const getById = async (id) => {
  const response = await apiClient.get(`/users/${id}`)
  return response.data
}

const remove = async (id) => {
  const response = await apiClient.delete(`/users/${id}`)
  return response.data
}

export default { setToken, getAll, update, getById, create, remove }