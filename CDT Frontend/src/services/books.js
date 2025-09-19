import apiClient, { setToken } from '../utils/apiClient'

const getAll = ({ page = 1, limit = 18 } = {}) => {
  const request = apiClient.get('/books', {
    params: { page, limit }
  })
  return request.then(response => response.data)
}


const create = async newObject => {
  const response = await apiClient.post('/books', newObject)
  return response.data
}

const update = async (id, newObject) => {
  const response = await apiClient.put(`/books/${id}`, newObject)
  return response.data
}

const lend = async (id, userId = null) => {
  const requestBody = userId ? { userId } : {}
  const response = await apiClient.put(`/books/${id}/lend`, requestBody)
  return response.data
}

const returnBook = async (id) => {
  const response = await apiClient.put(`/books/${id}/return`, {})
  return response.data
}

const clearHistory = async (id) => {
  const response = await apiClient.put(`/books/${id}/clear-history`, {})
  return response.data
}

const remove = async (id) => {
  const response = await apiClient.delete(`/books/${id}`)
  return response.data
}

export default { getAll, create, update, setToken, lend, returnBook, clearHistory, remove }