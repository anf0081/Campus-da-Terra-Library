import { useState } from 'react'
import { createPortal } from 'react-dom'
import dashboardService from '../services/dashboards'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'

const HistorySection = ({ studentId, history, isAdmin, onUpdate, showMessage }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eventType, setEventType] = useState('')
  const [uploadingInvoice, setUploadingInvoice] = useState(null)

  const handleAddEvent = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const newEvent = {
      type: formData.get('eventType'),
      date: formData.get('eventDate'),
      description: formData.get('description'),
      paymentStatus: formData.get('paymentStatus') || 'not_paid'
    }

    if (newEvent.type === 'receipt') {
      newEvent.month = formData.get('month')
      newEvent.year = parseInt(formData.get('year'))
    }

    const invoiceFile = formData.get('receiptFile')

    try {
      setIsSubmitting(true)

      // First, create the history event
      const updatedDashboard = await dashboardService.addHistoryEvent(studentId, newEvent)

      // If there's an invoice file and it's a receipt event, upload the file
      if (invoiceFile && invoiceFile.size > 0 && newEvent.type === 'receipt') {
        if (invoiceFile.size > 10 * 1024 * 1024) {
          showMessage('Invoice file size must be less than 10MB', 'error')
          return
        }

        // Find the newly created receipt event to get its ID
        const receiptEvents = updatedDashboard.history.filter(event =>
          event.type === 'receipt' &&
          event.month === newEvent.month &&
          event.year === newEvent.year
        )
        const newReceiptEvent = receiptEvents[receiptEvents.length - 1]

        if (newReceiptEvent) {
          await dashboardService.uploadInvoiceFile(studentId, newReceiptEvent._id, invoiceFile)
          // Fetch updated dashboard data to reflect the file upload
          const finalDashboard = await dashboardService.getByStudentId(studentId)
          onUpdate(finalDashboard)
        }
      } else {
        onUpdate(updatedDashboard)
      }

      setShowAddForm(false)
      showMessage('History event added successfully')
    } catch (error) {
      console.error('Error adding history event:', error)
      showMessage(error.response?.data?.error || 'Failed to add history event', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to remove this event?')) return

    try {
      const updatedDashboard = await dashboardService.removeHistoryEvent(studentId, eventId)
      onUpdate(updatedDashboard)
      showMessage('History event removed successfully')
    } catch (error) {
      console.error('Error removing history event:', error)
      showMessage(error.response?.data?.error || 'Failed to remove history event', 'error')
    }
  }

  const handleDownload = (event) => {
    if (event.downloadUrl) {
      const link = document.createElement('a')
      link.href = `${API_URL}${event.downloadUrl}`
      link.download = `${event.type}_${event.month || ''}_${event.year || new Date(event.date).getFullYear()}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleUploadInvoice = async (eventId, file) => {
    if (!file || file.size === 0) return

    if (file.size > 10 * 1024 * 1024) {
      showMessage('Invoice file size must be less than 10MB', 'error')
      return
    }

    try {
      setUploadingInvoice(eventId)
      await dashboardService.uploadInvoiceFile(studentId, eventId, file)
      const updatedDashboard = await dashboardService.getByStudentId(studentId)
      onUpdate(updatedDashboard)
      showMessage('Invoice uploaded successfully')
    } catch (error) {
      console.error('Error uploading invoice:', error)
      showMessage(error.response?.data?.error || 'Failed to upload invoice', 'error')
    } finally {
      setUploadingInvoice(null)
    }
  }

  const handleDeleteInvoice = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return

    try {
      setUploadingInvoice(eventId)
      await dashboardService.deleteInvoiceFile(studentId, eventId)
      const updatedDashboard = await dashboardService.getByStudentId(studentId)
      onUpdate(updatedDashboard)
      showMessage('Invoice deleted successfully')
    } catch (error) {
      console.error('Error deleting invoice:', error)
      showMessage(error.response?.data?.error || 'Failed to delete invoice', 'error')
    } finally {
      setUploadingInvoice(null)
    }
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'enrollment_start': return '🎓'
      case 'receipt': return '📄'
      case 'enrollment_end': return '🏁'
      default: return '📅'
    }
  }

  const getEventTitle = (event) => {
    switch (event.type) {
      case 'enrollment_start': return 'Enrollment Start'
      case 'receipt': return `Invoice - ${event.month} ${event.year}`
      case 'enrollment_end': return 'Expected Enrollment End'
      default: return event.description || 'Event'
    }
  }

  const getPaymentStatusClass = (status) =>
    status === 'paid' ? 'payment-status paid' : 'payment-status not-paid'

  const sortedHistory = history ? [...history].sort((a, b) => new Date(a.date) - new Date(b.date)) : []

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>History</h2>
        {isAdmin && (
          <button
            className="section-action-btn"
            onClick={() => setShowAddForm(true)}
            disabled={isSubmitting}
          >
            Add Event
          </button>
        )}
      </div>

      <div className="section-content">
        {sortedHistory.length > 0 ? (
          <div className="history-timeline">
            {sortedHistory.map((event, index) => (
              <div key={event._id || `${event.type}-${event.date}-${index}`} className="timeline-item">
                <div className="timeline-marker">
                  <span className="timeline-icon">{getEventIcon(event.type)}</span>
                </div>
                <div className="timeline-content">
                  <div className="event-header">
                    <h3 className="event-title">{getEventTitle(event)}</h3>
                    <span className="event-date">{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  {event.description && <p className="event-description">{event.description}</p>}
                  <div className="event-footer">
                    {event.type === 'receipt' && (
                      <span className={getPaymentStatusClass(event.paymentStatus)}>
                        {event.paymentStatus === 'paid' ?
                          <span className="success-text">✓ Paid</span> :
                          <span className="fail-text">✗ Not Paid</span>
                        }
                      </span>
                    )}
                    <div className="event-actions">
                      {event.downloadUrl && (
                        <button
                          onClick={() => handleDownload(event)}
                          className="download-btn btn-small"
                          title="Download document"
                        >
                          Download
                        </button>
                      )}

                      {isAdmin && event.type === 'receipt' && !event.downloadUrl && (
                        <div className="invoice-upload">
                          <input
                            type="file"
                            id={`upload-${event._id}`}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0]
                              if (file) {
                                handleUploadInvoice(event._id, file)
                              }
                            }}
                          />
                          <button
                            onClick={() => document.getElementById(`upload-${event._id}`).click()}
                            className="upload-btn btn-small"
                            title="Upload invoice"
                            disabled={uploadingInvoice === event._id}
                          >
                            {uploadingInvoice === event._id ? 'Uploading...' : 'Upload Invoice'}
                          </button>
                        </div>
                      )}

                      {isAdmin && event.type === 'receipt' && event.downloadUrl && (
                        <>
                          <div className="invoice-replace">
                            <input
                              type="file"
                              id={`replace-${event._id}`}
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) {
                                  handleUploadInvoice(event._id, file)
                                }
                              }}
                            />
                            <button
                              onClick={() => document.getElementById(`replace-${event._id}`).click()}
                              className="replace-btn btn-small"
                              title="Replace invoice"
                              disabled={uploadingInvoice === event._id}
                            >
                              {uploadingInvoice === event._id ? 'Replacing...' : 'Replace Invoice'}
                            </button>
                          </div>
                          <button
                            onClick={() => handleDeleteInvoice(event._id)}
                            className="btn-danger btn-small"
                            title="Delete invoice"
                            disabled={uploadingInvoice === event._id}
                          >
                            Delete Invoice
                          </button>
                        </>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveEvent(event._id)}
                          className="btn-danger btn-small"
                          title="Remove event"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-history">
            <p>No history events yet.</p>
          </div>
        )}
      </div>

      {showAddForm &&
        createPortal(
          <div className="form-popup-overlay" onClick={() => setShowAddForm(false)}>
            <div className="form-popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <h3>Add History Event</h3>
                <button className="close-btn" onClick={() => setShowAddForm(false)}>
                  ×
                </button>
              </div>
              <div className="history-content">
                <form onSubmit={handleAddEvent} className="event-form">
                  <div className="form-group">
                    <label htmlFor="eventType">Event Type:</label>
                    <select
                      id="eventType"
                      name="eventType"
                      required
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                    >
                      <option value="">Select event type</option>
                      <option value="enrollment_start">Enrollment Start</option>
                      <option value="receipt">Receipt</option>
                      <option value="enrollment_end">Expected Enrollment End</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="eventDate">Date:</label>
                    <input type="date" id="eventDate" name="eventDate" required />
                  </div>

                  {eventType === 'receipt' && (
  <>
    <div className="form-group">
      <label htmlFor="month">Month:</label>
      <select id="month" name="month" required>
        {[
          'January','February','March','April','May','June',
          'July','August','September','October','November','December'
        ].map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>

    <div className="form-group">
      <label htmlFor="year">Year:</label>
      <input type="number" id="year" name="year" min="2020" max="2030" required />
    </div>

    <div className="form-group">
      <label htmlFor="paymentStatus">Payment Status:</label>
      <select id="paymentStatus" name="paymentStatus" defaultValue="not_paid">
        <option value="not_paid">Not Paid</option>
        <option value="paid">Paid</option>
      </select>
    </div>

    <div className="form-group">
      <label htmlFor="receiptFile">Invoice File (Optional):</label>
      <input
        type="file"
        id="receiptFile"
        name="receiptFile"
        accept=".pdf,.jpg,.jpeg,.png"
      />
      <small>Accepted formats: PDF, JPG, PNG (Max: 10MB)</small>
    </div>
  </>
)}

                  <div className="form-group">
                    <label htmlFor="description">Description (Optional):</label>
                    <textarea id="description" name="description" rows="3" placeholder="Additional details..." />
                  </div>

                  <div className="form-actions">
                    <button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Adding...' : 'Add Event'}
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

export default HistorySection
