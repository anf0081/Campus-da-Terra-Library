import { useState } from 'react'
import { createPortal } from 'react-dom'
import dashboardService from '../services/dashboards'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'

const HistorySection = ({ studentId, history, isAdmin, onUpdate, showMessage }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eventType, setEventType] = useState('')

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

    try {
      setIsSubmitting(true)
      const updatedDashboard = await dashboardService.addHistoryEvent(studentId, newEvent)
      onUpdate(updatedDashboard)
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
      case 'receipt': return `Receipt - ${event.month} ${event.year}`
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
                        {event.paymentStatus === 'paid' ? <div className="success-text">&#10003; Paid</div> : <div className="fail-text">&#10007; Not Paid</div>}
                      </span>
                    )}
                    <div className="event-actions">
                      {event.downloadUrl && (
                        <button
                          onClick={() => handleDownload(event)}
                          className="download-btn small"
                          title="Download document"
                        >
                          Download
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveEvent(event._id)}
                          className="remove-btn small"
                          title="Remove event"
                        >
                          &#10006;
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
            {isAdmin && <button onClick={() => setShowAddForm(true)}>Add First Event</button>}
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
