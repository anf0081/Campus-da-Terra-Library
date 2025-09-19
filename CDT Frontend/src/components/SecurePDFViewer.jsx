import useSecureDocument from '../hooks/useSecureDocument'
import dashboardService from '../services/dashboards'

const SecurePDFViewer = ({ studentId, documentId, type, fileName, className = '', ...props }) => {
  // Always call the hook, but only use it for non-portfolio types
  const { documentUrl: secureDocumentUrl, loading, error } = useSecureDocument(
    type !== 'portfolio' ? studentId : null,
    type !== 'portfolio' ? documentId : null,
    type !== 'portfolio' ? type : null
  )

  // For portfolios, use the proxy endpoint directly
  const documentUrl = type === 'portfolio'
    ? dashboardService.getPortfolioViewUrl(studentId, documentId)
    : secureDocumentUrl

  // For portfolios, there's no loading state since we use direct URL
  if (type === 'portfolio') {
    return (
      <div className={className} {...props}>
        <iframe
          src={documentUrl}
          title={`PDF - ${fileName}`}
          className="border-none w-full h-full"
          style={{ minHeight: '600px' }}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} {...props}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error || !documentUrl) {
    const isLegacyStorageError = error && error.includes('legacy storage')

    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} {...props}>
        <div className="text-center p-4">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-sm text-gray-600 mb-2">
            {isLegacyStorageError
              ? 'This file needs to be re-uploaded for secure access'
              : error ? 'Error loading PDF' : 'PDF not available'
            }
          </p>
          {isLegacyStorageError && (
            <p className="text-xs text-gray-500">
              Contact an administrator to re-upload this file with secure storage.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={className} {...props}>
      <iframe
        src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=1`}
        title={`PDF - ${fileName}`}
        className="border-none w-full h-full"
        style={{ minHeight: '600px' }}
      />
    </div>
  )
}

export default SecurePDFViewer