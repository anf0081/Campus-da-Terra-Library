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

  const response = await apiClient.post(`/dashboards/${studentId}/portfolios`, formData, {
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

const removePortfolio = async (studentId, portfolioId) => {
  const response = await apiClient.delete(`/dashboards/${studentId}/portfolios/${portfolioId}`)
  return response.data
}

const replacePortfolio = async (studentId, portfolioId, file) => {
  const formData = new FormData()
  formData.append('portfolio', file)

  const response = await apiClient.put(`/dashboards/${studentId}/portfolios/${portfolioId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

const uploadInvoiceFile = async (studentId, historyId, file) => {
  const formData = new FormData()
  formData.append('receiptFile', file)

  const response = await apiClient.post(`/dashboards/${studentId}/history/${historyId}/receipt`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

const deleteInvoiceFile = async (studentId, historyId) => {
  const response = await apiClient.delete(`/dashboards/${studentId}/history/${historyId}/receipt`)
  return response.data
}

const getSecurePortfolioUrl = async (studentId, portfolioId) => {
  const response = await apiClient.get(`/dashboards/${studentId}/portfolios/${portfolioId}/url`)
  return response.data.url
}

const getPortfolioViewUrl = (studentId, portfolioId) => {
  // Include token in query params for iframe viewing since headers can't be sent
  const loggedUserJSON = localStorage.getItem('loggedlibraryUser')
  const token = loggedUserJSON ? JSON.parse(loggedUserJSON).token : null
  return token
    ? `/api/dashboards/${studentId}/portfolios/${portfolioId}/view?token=${encodeURIComponent(token)}`
    : `/api/dashboards/${studentId}/portfolios/${portfolioId}/view`
}

const getSecureDocumentUrl = async (studentId, documentId) => {
  const response = await apiClient.get(`/dashboards/${studentId}/documents/${documentId}/url`)
  return response.data.url
}

const getSecureInvoiceUrl = async (studentId, historyId) => {
  const response = await apiClient.get(`/dashboards/${studentId}/history/${historyId}/receipt/url`)
  return response.data.url
}

export default {
  setToken,
  getByStudentId,
  update,
  uploadPortfolio,
  removePortfolio,
  replacePortfolio,
  addDocument,
  removeDocument,
  addHistoryEvent,
  removeHistoryEvent,
  uploadInvoiceFile,
  deleteInvoiceFile,
  getSecurePortfolioUrl,
  getPortfolioViewUrl,
  getSecureDocumentUrl,
  getSecureInvoiceUrl
}