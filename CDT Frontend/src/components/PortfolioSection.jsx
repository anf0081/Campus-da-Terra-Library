import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import dashboardService from '../services/dashboards'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'

const PortfolioSection = ({ studentId, portfolio, isAdmin, onUpdate, showMessage }) => {
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mounted, setMounted] = useState(false) // for SSR safety

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileUpload = async (event) => {
    event.preventDefault()
    const file = event.target.portfolioFile?.files?.[0] // safer access

    if (!file) {
      showMessage('Please select a file', 'error')
      return
    }

    if (file.type !== 'application/pdf') {
      showMessage('Please select a PDF file', 'error')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      showMessage('File size must be less than 10MB', 'error')
      return
    }

    try {
      setUploading(true)
      const updatedDashboard = await dashboardService.uploadPortfolio(studentId, file)
      onUpdate(updatedDashboard)
      setShowUploadForm(false)
      showMessage('Portfolio uploaded successfully')
    } catch (error) {
      console.error('Error uploading portfolio:', error)
      showMessage(error.response?.data?.error || 'Failed to upload portfolio', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = () => {
    if (portfolio && portfolio.pdfUrl) {
      const link = document.createElement('a')
      link.href = `${API_URL}${portfolio.pdfUrl}`
      link.setAttribute('download', portfolio.fileName || 'portfolio.pdf')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>📁 Portfolio</h2>
        {isAdmin && (
          <button
            className="section-action-btn"
            onClick={() => setShowUploadForm(true)}
            disabled={uploading}
          >
            { portfolio?.pdfUrl ? 'Replace Portfolio' : 'Upload Portfolio'}
          </button>
        )}
      </div>

      <div className="section-content">
        {portfolio?.pdfUrl ? (
          <div className="portfolio-viewer">
            <div className="portfolio-info">
              <span className="file-name">{portfolio.fileName}</span>
              {portfolio.uploadDate && (
                <span className="upload-date">
                  Uploaded: {new Date(portfolio.uploadDate).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="portfolio-actions">
              <button onClick={handleDownload} className="download-btn">
                📥 Download PDF
              </button>
            </div>

            <div className="pdf-viewer">
              <iframe
                src={`${API_URL}${portfolio.pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                title="Portfolio PDF"
                width="100%"
                height="600px"
                style={{ border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          </div>
        ) : (
          <div className="no-portfolio">
            <p>No portfolio uploaded yet.</p>
            {isAdmin && (
              <button onClick={() => setShowUploadForm(true)}>
                Upload Portfolio
              </button>
            )}
          </div>
        )}
      </div>

      {mounted && showUploadForm && createPortal(
        <div className="form-popup-overlay" onClick={() => setShowUploadForm(false)}>
          <div className="form-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>{portfolio?.pdfUrl ? 'Replace Portfolio' : 'Upload Portfolio'}</h3>
              <button className="close-btn" onClick={() => setShowUploadForm(false)}>×</button>
            </div>
            <div className="history-content">
              <form onSubmit={handleFileUpload} className="upload-form">
                <div className="form-group">
                  <label htmlFor="portfolioFile">Select PDF file:</label>
                  <input
                    type="file"
                    id="portfolioFile"
                    name="portfolioFile"
                    accept=".pdf"
                    required
                  />
                  <small>Maximum file size: 10MB</small>
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button type="button" onClick={() => setShowUploadForm(false)}>
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

export default PortfolioSection
