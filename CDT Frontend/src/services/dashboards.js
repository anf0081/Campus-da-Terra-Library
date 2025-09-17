import apiClient, { setToken } from '../utils/apiClient'

const getByStudentId = async (studentId) => {
  const response = await apiClient.get(`/dashboards/${studentId}`)
  return response.data
}

const update = async (studentId, updates) => {
  const response = await apiClient.put(`/dashboards/${studentId}`, updates)
  return response.data
}

const uploadPortfolio = async (studentId, file) => {
  const formData = new FormData()
  formData.append('portfolio', file)

  const response = await apiClient.post(`/dashboards/${studentId}/portfolio`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

const addDocument = async (studentId, file, name) => {
  const formData = new FormData()
  formData.append('document', file)
  formData.append('name', name)

  const response = await apiClient.post(`/dashboards/${studentId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

const removeDocument = async (studentId, documentId) => {
  const response = await apiClient.delete(`/dashboards/${studentId}/documents/${documentId}`)
  return response.data
}

const addHistoryEvent = async (studentId, event) => {
  const response = await apiClient.post(`/dashboards/${studentId}/history`, event)
  return response.data
}

const removeHistoryEvent = async (studentId, historyId) => {
  const response = await apiClient.delete(`/dashboards/${studentId}/history/${historyId}`)
  return response.data
}

export default {
  setToken,
  getByStudentId,
  update,
  uploadPortfolio,
  addDocument,
  removeDocument,
  addHistoryEvent,
  removeHistoryEvent
}