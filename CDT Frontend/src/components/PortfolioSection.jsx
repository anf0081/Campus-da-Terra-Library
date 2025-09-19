import { useState } from 'react'
import { createPortal } from 'react-dom'
import dashboardService from '../services/dashboards'
import SecurePDFViewer from './SecurePDFViewer'

const PortfolioSection = ({ studentId, portfolios = [], isAdmin, onUpdate, showMessage }) => {
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [replacingPortfolioId, setReplacingPortfolioId] = useState(null)
  const [viewingPortfolioId, setViewingPortfolioId] = useState(null)

  const handleFileUpload = async (event) => {
    event.preventDefault()
    const file = event.target.portfolioFile?.files?.[0]

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
      let updatedDashboard

      if (replacingPortfolioId) {
        updatedDashboard = await dashboardService.replacePortfolio(studentId, replacingPortfolioId, file)
        showMessage('Portfolio replaced successfully')
      } else {
        updatedDashboard = await dashboardService.uploadPortfolio(studentId, file)
        showMessage('Portfolio uploaded successfully')
      }

      onUpdate(updatedDashboard)
      setShowUploadForm(false)
      setReplacingPortfolioId(null)
    } catch (error) {
      console.error('Error uploading portfolio:', error)
      showMessage(error.response?.data?.error || 'Failed to upload portfolio', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (portfolio) => {
    if (portfolio && portfolio.pdfUrl) {
      try {
        const secureUrl = await dashboardService.getSecurePortfolioUrl(studentId, portfolio.id || portfolio._id)
        const link = document.createElement('a')
        link.href = secureUrl
        link.setAttribute('download', portfolio.fileName || 'portfolio.pdf')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        console.error('Error getting secure download URL:', error)
        if (error.response?.data?.error?.includes('legacy storage')) {
          showMessage('This portfolio uses legacy storage and needs to be re-uploaded by an administrator for secure access', 'error')
        } else {
          showMessage('Failed to download portfolio', 'error')
        }
      }
    }
  }

  const handleDelete = async (portfolio) => {
    if (window.confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      try {
        const updatedDashboard = await dashboardService.removePortfolio(studentId, portfolio.id || portfolio._id)
        onUpdate(updatedDashboard)
        showMessage('Portfolio deleted successfully')
      } catch (error) {
        console.error('Error deleting portfolio:', error)
        showMessage(error.response?.data?.error || 'Failed to delete portfolio', 'error')
      }
    }
  }

  const handleReplace = (portfolio) => {
    setReplacingPortfolioId(portfolio.id || portfolio._id)
    setShowUploadForm(true)
  }

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Portfolios</h2>
        {isAdmin && (
          <button
            className="section-action-btn"
            onClick={() => setShowUploadForm(true)}
            disabled={uploading}
          >
            Add Portfolio
          </button>
        )}
      </div>

      <div className="p-0">
        {portfolios && portfolios.length > 0 ? (
          <div className="space-y-4 portfolios-list">
            {portfolios.map((portfolio, index) => {
              if (!portfolio) return null

              return (
                <div key={portfolio.id || portfolio._id || index} className="portfolio">
                  <div className="bg-custom-beige rounded-lg p-4 hover:bg-custom-yellow transition-colors duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-accent flex items-center gap-2">
                          <span className="text-lg">📄</span>
                          {portfolio.fileName || 'Untitled Portfolio'}
                        </span>
                        {portfolio.uploadDate && (
                          <span className="text-sm text-text-secondary flex items-center gap-1">
                            <span className="text-xs">📅</span>
                            {new Date(portfolio.uploadDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setViewingPortfolioId(
                            viewingPortfolioId === (portfolio.id || portfolio._id) ? null : (portfolio.id || portfolio._id)
                          )}
                          className="bg-custom-yellow text-text-color border-2 border-custom-yellow px-lg py-md rounded-md font-semibold text-sm cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-sm min-h-11 hover:bg-accent hover:border-accent hover:text-white hover:translate-y-neg-0.5 hover:shadow-md"
                        >
                          {viewingPortfolioId === (portfolio.id || portfolio._id) ? 'Hide' : 'View'}
                        </button>
                        <button
                          onClick={() => handleDownload(portfolio)}
                          className="bg-white text-accent border-2 border-accent px-lg py-md rounded-md font-semibold text-sm cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-sm min-h-11 hover:bg-accent hover:text-white hover:translate-y-neg-0.5 hover:shadow-md"
                        >
                          Download
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleReplace(portfolio)}
                              className="btn-secondary btn-small"
                            >
                              Replace
                            </button>
                            <button
                              onClick={() => handleDelete(portfolio)}
                              className="btn-danger btn-small"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {(portfolio.id || portfolio._id) && viewingPortfolioId === (portfolio.id || portfolio._id) && (
                    <div className="mt-4 bg-white rounded-lg border-2 border-custom-beige overflow-hidden">
                      <SecurePDFViewer
                        studentId={studentId}
                        documentId={portfolio.id || portfolio._id}
                        type="portfolio"
                        fileName={portfolio.fileName || 'Portfolio'}
                        width="100%"
                        height="600px"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-lg mb-6">No portfolios uploaded yet.</p>
          </div>
        )}
      </div>

      {showUploadForm && createPortal(
        <div className="form-popup-overlay" onClick={() => {
          setShowUploadForm(false)
          setReplacingPortfolioId(null)
        }}>
          <div className="form-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>{replacingPortfolioId ? 'Replace Portfolio' : 'Add Portfolio'}</h3>
              <button className="close-btn" onClick={() => {
                setShowUploadForm(false)
                setReplacingPortfolioId(null)
              }}>×</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleFileUpload} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="portfolioFile" className="block text-sm font-semibold text-text-color">Select PDF file:</label>
                  <input
                    type="file"
                    id="portfolioFile"
                    name="portfolioFile"
                    accept=".pdf"
                    required
                    className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-custom-beige file:text-accent hover:file:bg-custom-yellow transition-colors duration-200"
                  />
                  <small className="text-xs text-text-muted">Maximum file size: 10MB</small>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-custom-yellow">
                  <button type="submit" disabled={uploading} className="btn-primary">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button type="button" onClick={() => {
                    setShowUploadForm(false)
                    setReplacingPortfolioId(null)
                  }} className="btn-secondary">
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
