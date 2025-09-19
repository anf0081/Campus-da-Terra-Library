import { useState } from 'react'
import { createPortal } from 'react-dom'
import dashboardService from '../services/dashboards'

const DocumentsSection = ({ studentId, documents, isAdmin, onUpdate, showMessage }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)

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

  const handleDownload = async (doc) => {
    try {
      const secureUrl = await dashboardService.getSecureDocumentUrl(studentId, doc._id || doc.id)
      const fileName = doc.fileName || doc.name || 'document'

      // Check if it's a viewable file type (images, PDFs)
      const isViewable = /\.(pdf|jpg|jpeg|png|gif)$/i.test(fileName)

      const link = window.document.createElement('a')
      link.href = secureUrl
      link.download = fileName

      // Only open in new tab for viewable files
      if (isViewable) {
        link.target = '_blank'
      }

      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (error) {
      console.error('Error getting secure download URL:', error)
      if (error.response?.data?.error?.includes('legacy storage')) {
        showMessage('This document uses legacy storage and needs to be re-uploaded by an administrator for secure access', 'error')
      } else {
        showMessage('Failed to download document', 'error')
      }
    }
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
                <div className="document-info">
                  <div className="document-name">
                    {doc.name}
                  </div>
                  {doc.fileName && (
                    <div className="document-filename">
                      {doc.fileName}
                    </div>
                  )}
                </div>
                <div className="document-actions">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="download-btn btn-small"
                    title="Download document"
                  >
                    Download
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveDocument(doc._id || doc.id)}
                      className="delete-btn btn-small"
                      title="Remove document"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-documents">
            <p>No documents available.</p>
          </div>
        )}
      </div>

      {showAddForm && createPortal(
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
