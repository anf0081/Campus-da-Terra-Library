import { useState, useEffect, useCallback } from 'react'
import studentService from '../services/students'

// Cache for storing signed URLs to avoid repeated API calls
const urlCache = new Map()

const useSecureImage = (studentId) => {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSecureUrl = useCallback(async () => {
    if (!studentId) {
      setImageUrl(null)
      return
    }

    // Check cache first
    const cacheKey = `student-${studentId}`
    const cached = urlCache.get(cacheKey)

    // If cached and not expired (buffer of 5 minutes before expiry)
    if (cached && new Date(cached.expiresAt) > new Date(Date.now() + 5 * 60 * 1000)) {
      setImageUrl(cached.url)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await studentService.getProfilePictureUrl(studentId)

      // Cache the result
      urlCache.set(cacheKey, {
        url: result.url,
        expiresAt: result.expiresAt,
        fetchedAt: new Date().toISOString()
      })

      setImageUrl(result.url)
    } catch (err) {
      console.error('Error fetching secure image URL:', err)
      setImageUrl(null)

      // Handle specific error types
      if (err.response?.data?.error?.includes('legacy storage')) {
        setError('legacy_storage')
      } else if (err.response?.status === 404) {
        setError('not_found')
      } else {
        setError('fetch_failed')
      }

      // Remove from cache on error
      urlCache.delete(cacheKey)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchSecureUrl()
  }, [fetchSecureUrl])

  // Method to refresh the URL (useful when uploading new image)
  const refreshUrl = useCallback(() => {
    if (studentId) {
      urlCache.delete(`student-${studentId}`)
      fetchSecureUrl()
    }
  }, [studentId, fetchSecureUrl])

  // Method to clear the URL (useful when removing image)
  const clearUrl = useCallback(() => {
    if (studentId) {
      urlCache.delete(`student-${studentId}`)
      setImageUrl(null)
    }
  }, [studentId])

  return {
    imageUrl,
    loading,
    error,
    refreshUrl,
    clearUrl
  }
}

export default useSecureImage