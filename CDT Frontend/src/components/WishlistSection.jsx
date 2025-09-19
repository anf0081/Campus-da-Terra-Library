import { useState, useEffect } from 'react'
import studentService from '../services/students'
import bookService from '../services/books'

const WishlistSection = ({ studentId, user, showMessage }) => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true)
        const wishlistData = await studentService.getWishlist(studentId)
        setWishlist(wishlistData)
      } catch (error) {
        console.error('Error fetching wishlist:', error)
        showMessage('Failed to load wishlist', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      fetchWishlist()
    }
  }, [studentId, showMessage])

  const handleRemoveFromWishlist = async (bookId) => {
    if (!window.confirm('Are you sure you want to remove this book from the wishlist?')) return

    try {
      await studentService.removeFromWishlist(studentId, bookId)
      setWishlist(prev => prev.filter(item => (item.bookId._id || item.bookId.id) !== bookId))
      showMessage('Book removed from wishlist successfully')
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      showMessage(error.response?.data?.error || 'Failed to remove book from wishlist', 'error')
    }
  }

  const handleBorrowBook = async (bookId) => {
    try {
      await bookService.lend(bookId)
      showMessage('Book borrowed successfully for 3 weeks')
      // Refresh wishlist to get updated book status
      const wishlistData = await studentService.getWishlist(studentId)
      setWishlist(wishlistData)
    } catch (error) {
      console.error('Error borrowing book:', error)
      showMessage(error.response?.data?.error || 'Failed to borrow book', 'error')
    }
  }

  const handleReturnBook = async (bookId) => {
    try {
      await bookService.returnBook(bookId)
      showMessage('Book returned successfully')
      // Refresh wishlist to get updated book status
      const wishlistData = await studentService.getWishlist(studentId)
      setWishlist(wishlistData)
    } catch (error) {
      console.error('Error returning book:', error)
      showMessage(error.response?.data?.error || 'Failed to return book', 'error')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Reading Wishlist</h2>
        </div>
        <div className="section-content">
          <div className="loading">Loading wishlist...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Reading Wishlist</h2>
        <div className="wishlist-count">
          {wishlist.length} book{wishlist.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="section-content">
        {wishlist.length > 0 ? (
          <div className="wishlist-grid">
            {wishlist.map((item) => {
              const book = item.bookId
              const bookId = book._id || book.id
              const isAvailable = !book.lending?.isLent
              const isBorrower = user && book.lending?.borrower &&
                String(book.lending.borrower._id || book.lending.borrower.id || book.lending.borrower).trim() === String(user.id).trim()
              const canBorrow = user && user.role !== 'admin' && user.role !== 'tutor' && isAvailable
              const canReturn = user && isBorrower

              return (
                <div key={bookId} className="wishlist-item">
                  <div className="wishlist-book-image">
                    <img
                      src={book.url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAFBy_9Wwc7vUhLMgzzACgvfPcWQOw297s2Q&s"}
                      alt={`${book.title} cover`}
                      onError={(e) => {
                        e.target.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAFBy_9Wwc7vUhLMgzzACgvfPcWQOw297s2Q&s"
                      }}
                    />
                  </div>
                  <div className="wishlist-book-info">
                    <h4 className="wishlist-book-title">{book.title}</h4>
                    <p className="wishlist-book-author">by {book.author}</p>
                    <div className="wishlist-book-details">
                      {book.language && (
                        <span className="book-badge language-badge">{book.language}</span>
                      )}
                      {book.difficulty && (
                        <span className="book-badge difficulty-badge">{book.difficulty}</span>
                      )}
                    </div>
                    <div className="wishlist-date">
                      Added {formatDate(item.addedDate)}
                    </div>
                  </div>
                  <div className="wishlist-actions">
                    {canBorrow && (
                      <button
                        className="btn-borrow small"
                        onClick={() => handleBorrowBook(bookId)}
                        title="Borrow book"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                        Borrow
                      </button>
                    )}
                    {canReturn && (
                      <button
                        className="btn-borrow small outlined"
                        onClick={() => handleReturnBook(bookId)}
                        title="Return book"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 14l-5-5 5-5"/>
                          <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H13"/>
                        </svg>
                        Return
                      </button>
                    )}
                    <button
                      className="btn-borrow small outlined remove"
                      onClick={() => handleRemoveFromWishlist(bookId)}
                      title="Remove from wishlist"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18"/>
                        <path d="M6 6l12 12"/>
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="no-wishlist">
            <p>No books in the wishlist yet.</p>
            <p className="hint">Books can be added to the wishlist from the library.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WishlistSection