import apiClient, { setToken } from '../utils/apiClient'

const getAll = async () => {
  const response = await apiClient.get('/students')
  return response.data
}

const getById = async (id) => {
  const response = await apiClient.get(`/students/${id}`)
  return response.data
}

const create = async (studentData) => {
  const response = await apiClient.post('/students', studentData)
  return response.data
}

const update = async (id, studentData) => {
  const response = await apiClient.put(`/students/${id}`, studentData)
  return response.data
}

const remove = async (id) => {
  const response = await apiClient.delete(`/students/${id}`)
  return response.data
}

export default { setToken, getAll, getById, create, update, remove }