import { useState, useEffect } from 'react'
import dashboardService from '../services/dashboards'

const useSecureDocument = (studentId, documentId, type) => {
  const [documentUrl, setDocumentUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!studentId || !documentId || !type) {
      setDocumentUrl(null)
      setLoading(false)
      return
    }

    const getSecureUrl = async () => {
      try {
        setLoading(true)
        setError(null)

        let url
        switch (type) {
          case 'portfolio':
            url = await dashboardService.getSecurePortfolioUrl(studentId, documentId)
            break
          case 'document':
            url = await dashboardService.getSecureDocumentUrl(studentId, documentId)
            break
          case 'invoice':
            url = await dashboardService.getSecureInvoiceUrl(studentId, documentId)
            break
          default:
            throw new Error('Invalid document type')
        }

        setDocumentUrl(url)
      } catch (err) {
        console.error('Error getting secure document URL:', err)
        setError(err.response?.data?.error || err.message || 'Failed to load document')
        setDocumentUrl(null)
      } finally {
        setLoading(false)
      }
    }

    getSecureUrl()
  }, [studentId, documentId, type])

  return { documentUrl, loading, error }
}

export default useSecureDocument