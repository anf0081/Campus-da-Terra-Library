import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import dashboardService from '../services/dashboards'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'

const DocumentsSection = ({ studentId, documents, isAdmin, onUpdate, showMessage }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAddDocument = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const file = formData.get('documentFile')
    const name = formData.get('documentName')

    if (!(file instanceof File) || !name) {
      showMessage('Please provide both file and name', 'error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage('File size must be less than 10MB', 'error')
      return
    }

    try {
      setUploading(true)
      const updatedDashboard = await dashboardService.addDocument(studentId, file, name)
      onUpdate(updatedDashboard)
      setShowAddForm(false)
      showMessage('Document added successfully')
    } catch (error) {
      console.error('Error adding document:', error)
      showMessage(error.response?.data?.error || 'Failed to add document', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to remove this document?')) return

    try {
      const updatedDashboard = await dashboardService.removeDocument(studentId, documentId)
      onUpdate(updatedDashboard)
      showMessage('Document removed successfully')
    } catch (error) {
      console.error('Error removing document:', error)
      showMessage(error.response?.data?.error || 'Failed to remove document', 'error')
    }
  }

  const handleDownload = (doc) => {
    const link = window.document.createElement('a')
    link.href = `${API_URL}${doc.url}`
    link.download = doc.fileName || doc.name || 'document'
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Documents</h2>
        {isAdmin && (
          <button
            className="section-action-btn"
            onClick={() => setShowAddForm(true)}
            disabled={uploading}
          >
            Add Document
          </button>
        )}
      </div>

      <div className="section-content">
        {documents?.length > 0 ? (
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc._id || doc.id} className="document-item">
                <button
                  className="document-name-btn"
                  onClick={() => handleDownload(doc)}
                  title="Download document"
                >
                  {doc.name}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleRemoveDocument(doc._id || doc.id)}
                    className="remove-btn"
                    title="Remove document"
                  >
                    &#10006;
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-documents">
            <p>No documents available.</p>
          </div>
        )}
      </div>

      {mounted && showAddForm && createPortal(
        <div className="form-popup-overlay" onClick={() => setShowAddForm(false)}>
          <div className="form-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Add Document</h3>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <div className="history-content">
              <form onSubmit={handleAddDocument} className="upload-form">
                <div className="form-group">
                  <label htmlFor="documentName">Document Name:</label>
                  <input
                    type="text"
                    id="documentName"
                    name="documentName"
                    placeholder="e.g., Enrollment Contract, Medical Certificate"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="documentFile">Select file:</label>
                  <input
                    type="file"
                    id="documentFile"
                    name="documentFile"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    required
                  />
                  <small>Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max: 10MB)</small>
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={uploading}>
                    {uploading ? 'Adding...' : 'Add Document'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default DocumentsSection
