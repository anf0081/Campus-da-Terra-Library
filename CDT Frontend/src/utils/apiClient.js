import axios from 'axios'

let token = null
let onTokenExpiredCallback = null

const apiClient = axios.create({
  baseURL: '/api'
})

// Request interceptor to add authorization header
apiClient.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error

      // Check if the error is related to token issues
      const tokenErrors = ['token missing', 'token invalid', 'token expired', 'user not found']

      if (tokenErrors.some(msg => errorMessage?.includes(msg))) {
        // Clear the token and trigger logout
        token = null
        if (onTokenExpiredCallback) {
          onTokenExpiredCallback()
        }
      }
    }
    return Promise.reject(error)
  }
)

export const setToken = (newToken) => {
  token = newToken ? `Bearer ${newToken}` : null
}

export const setOnTokenExpiredCallback = (callback) => {
  onTokenExpiredCallback = callback
}

export default apiClient