import axios from 'axios'

const baseURL = '/api'

let token = null

const setToken = newToken => {
  token = newToken
}

export { setToken }

export default {
  get: (url, config = {}) => {
    return axios.get(`${baseURL}${url}`, {
      ...config,
      headers: {
        ...config.headers,
        Authorization: token ? `Bearer ${token}` : ''
      }
    })
  },
  post: (url, data, config = {}) => {
    return axios.post(`${baseURL}${url}`, data, {
      ...config,
      headers: {
        ...config.headers,
        Authorization: token ? `Bearer ${token}` : ''
      }
    })
  },
  put: (url, data, config = {}) => {
    return axios.put(`${baseURL}${url}`, data, {
      ...config,
      headers: {
        ...config.headers,
        Authorization: token ? `Bearer ${token}` : ''
      }
    })
  },
  delete: (url, config = {}) => {
    return axios.delete(`${baseURL}${url}`, {
      ...config,
      headers: {
        ...config.headers,
        Authorization: token ? `Bearer ${token}` : ''
      }
    })
  }
}