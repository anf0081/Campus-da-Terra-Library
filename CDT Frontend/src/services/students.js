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

const addToWishlist = async (studentId, bookId) => {
  const response = await apiClient.post(`/students/${studentId}/wishlist`, { bookId })
  return response.data
}

const removeFromWishlist = async (studentId, bookId) => {
  const response = await apiClient.delete(`/students/${studentId}/wishlist/${bookId}`)
  return response.data
}

const getWishlist = async (studentId) => {
  const response = await apiClient.get(`/students/${studentId}/wishlist`)
  return response.data
}

const uploadProfilePicture = async (studentId, file) => {
  const formData = new FormData()
  formData.append('profilePicture', file)

  const response = await apiClient.post(`/students/${studentId}/profile-picture`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

const removeProfilePicture = async (studentId) => {
  const response = await apiClient.delete(`/students/${studentId}/profile-picture`)
  return response.data
}

export default { setToken, getAll, getById, create, update, remove, addToWishlist, removeFromWishlist, getWishlist, uploadProfilePicture, removeProfilePicture }