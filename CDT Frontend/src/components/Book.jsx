import { useState } from 'react'
import { createPortal } from 'react-dom'

const Book = ({ book, user, onBorrow, onReturn, onClearHistory, onUpdateBook, onDeleteBook }) => {
  const [showHistory, setShowHistory] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const isAvailable = !book.lending?.isLent
  const isAdmin = user && user.role === 'admin'
  const isBorrower =
    user &&
    book.lending?.borrower &&
    String(book.lending.borrower._id || book.lending.borrower.id || book.lending.borrower).trim() === String(user.id).trim()
  const canBorrow = user && user.role !== 'admin' && user.role !== 'tutor' && isAvailable

  let daysLeft = null
  if (isBorrower && book.lending?.dueDate) {
    const due = new Date(book.lending.dueDate)
    const now = new Date()
    daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  }

  const defaultImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAFBy_9Wwc7vUhLMgzzACgvfPcWQOw297s2Q&s"

  const formatDate = (dateString) => {
    if (!dateString) return 'Not returned'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all borrowing history for this book? This action cannot be undone.')) {
      onClearHistory(book.id)
      setShowHistory(false)
    }
  }

  const handleUpdateBook = (updatedData) => {
    onUpdateBook(book.id, updatedData)
    setShowEditForm(false)
  }

  const handleDeleteBook = () => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`)) {
      onDeleteBook(book.id)
      setShowEditForm(false)
    }
  }

  return (
    <div className={`book-card ${showHistory ? 'popup-open' : ''}`}>
      <div className="book-image-container">
        <img
          src={book.url || defaultImage}
          alt={`${book.title} cover`}
          className="book-cover"
          onError={(e) => {
            e.target.src = defaultImage
          }}
        />
      </div>

      <div className="book-content">
        <div className="book-info">
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">by {book.author}</p>
        </div>

        <div className="book-status">
          <div className={`status-badge ${isAvailable ? 'available' : 'borrowed'}`}>
            {isAvailable ? '● Available' : isBorrower ? '● You borrowed this' : '● Lent out'}
          </div>

          {isBorrower && daysLeft !== null && (
            <div className={`days-left ${daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'warning' : 'normal'}`}>
              {daysLeft >= 0
                ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                : `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}`
              }
            </div>
          )}
        </div>

        <div className="book-actions">
          {canBorrow && (
            <button className="borrow-btn" onClick={() => onBorrow(book.id)}>
              Borrow for 3 weeks
            </button>
          )}
          {(book.lending?.isLent && (isBorrower || isAdmin)) && (
            <button className="return-btn" onClick={() => onReturn(book.id)}>
              Return Book
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="book-buttons">
          <button
            className="history-btn"
            onClick={() => setShowHistory(true)}
            title="View borrowing history"
          >
            📖
          </button>
          <button
            className="edit-btn"
            onClick={() => setShowEditForm(true)}
            title="Edit book details"
          >
            ✏️
          </button>
        </div>
      )}

      {showHistory && createPortal(
        <div className="form-popup-overlay" onClick={() => setShowHistory(false)}>
          <div className="form-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Borrowing History: {book.title}</h3>
              <div className="popup-header-actions">
                {isAdmin && (
                  <button
                    className="clear-history-btn"
                    onClick={() => handleClearHistory()}
                    title="Clear all borrowing history"
                  >
                    Clear History
                  </button>
                )}
                <button className="close-btn" onClick={() => setShowHistory(false)}>×</button>
              </div>
            </div>
            <div className="history-content">
              {book.lendingHistory && book.lendingHistory.length > 0 ? (
                <div className="history-list">
                  {book.lendingHistory
                    .sort((a, b) => new Date(b.lentDate) - new Date(a.lentDate))
                    .map((entry, index) => (
                    <div key={index} className="history-entry">
                      <div className="history-info">
                        <div className="borrower-info">
                          <strong>Borrower:</strong> {
                            entry.borrower?.name || entry.borrower?.username ||
                            (typeof entry.borrower === 'string' ? 'User deleted' : 'Unknown User')
                          }
                        </div>
                        <div className="history-dates">
                          <span className="borrowed-date">
                            <strong>Borrowed:</strong> {formatDate(entry.lentDate)}
                          </span>
                          <span className="due-date">
                            <strong>Due:</strong> {formatDate(entry.dueDate)}
                          </span>
                          <span className={`return-date ${entry.isReturned ? 'returned' : 'not-returned'}`}>
                            <strong>Returned:</strong> {entry.isReturned ? formatDate(entry.returnedDate) : 'Not returned'}
                          </span>
                        </div>
                      </div>
                      <div className={`history-status ${entry.isReturned ? 'returned' : 'borrowed'}`}>
                        {entry.isReturned ? '✓ Returned' : '📖 Still borrowed'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-history">
                  <p>No borrowing history available for this book.</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showEditForm && createPortal(
        <div className="form-popup-overlay" onClick={() => setShowEditForm(false)}>
          <div className="form-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Edit Book: {book.title}</h3>
              <button className="close-btn" onClick={() => setShowEditForm(false)}>×</button>
            </div>
            <div className="history-content">
              <EditBookForm
                book={book}
                onUpdate={handleUpdateBook}
                onDelete={handleDeleteBook}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const EditBookForm = ({ book, onUpdate, onDelete }) => {
  const [title, setTitle] = useState(book.title)
  const [author, setAuthor] = useState(book.author)
  const [url, setUrl] = useState(book.url)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Title is required')
      return
    }
    onUpdate({ title: title.trim(), author: author.trim() || 'Unknown Author', url: url.trim() || '' })
  }

  return (
    <form onSubmit={handleSubmit} className="edit-book-form">
      <div className="form-group">
        <label htmlFor="book-title">Title:</label>
        <input
          id="book-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="book-author">Author:</label>
        <input
          id="book-author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Unknown Author"
        />
      </div>
      <div className="form-group">
        <label htmlFor="book-url">Cover Image URL:</label>
        <input
          id="book-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="save-btn">Save Changes</button>
        <button type="button" onClick={onDelete} className="delete-btn">Delete Book</button>
      </div>
    </form>
  )
}

export default Book