import apiClient, { setToken } from '../utils/apiClient'

const getAll = () => {
  const request = apiClient.get('/books')
  return request.then(response => response.data)
}

const create = async newObject => {
  const response = await apiClient.post('/books', newObject)
  return response.data
}

const update = (id, newObject) => {
  const request = apiClient.put(`/books/${id}`, newObject)
  return request.then(response => response.data)
}

const lend = async (id) => {
  const response = await apiClient.put(`/books/${id}/lend`, {})
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