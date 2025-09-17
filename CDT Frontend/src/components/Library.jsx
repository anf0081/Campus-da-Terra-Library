import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Book from './Book'
import BookForm from './BookForm'
import bookService from '../services/books'

const Library = ({ user, setMessage, setClassName }) => {
  const [books, setBooks] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    bookService.getAll().then(books =>
      setBooks(books)
    ).catch(error => {
      console.error('Error fetching books:', error)
      setBooks([])
    })
  }, [])

  const addBook = async (bookObject) => {
    try {
      const returnedBook = await bookService.create(bookObject)
      setBooks(books.concat(returnedBook))
      setShowCreateForm(false)
      setMessage(`${returnedBook.title} added successfully`)
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch {
      setMessage('Error creating book')
      setTimeout(() => {
        setMessage(null)
      }, 5000)
    }
  }

  const handleBorrow = async (bookId) => {
    try {
      const updatedBook = await bookService.lend(bookId)
      setBooks(books.map(b => b.id === bookId ? updatedBook : b))
      setMessage('Book borrowed for 3 weeks')
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch (error) {
      const backendMsg = error.response?.data?.error
      setMessage(backendMsg || 'Could not borrow book')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleReturn = async (bookId) => {
    try {
      const updatedBook = await bookService.returnBook(bookId)
      setBooks(books.map(b => b.id === bookId ? updatedBook : b))
      setMessage('Book returned successfully')
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch (error) {
      const backendMsg = error.response?.data?.error
      setMessage(backendMsg || 'Could not return book')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleClearHistory = async (bookId) => {
    try {
      const updatedBook = await bookService.clearHistory(bookId)
      setBooks(books.map(b => b.id === bookId ? updatedBook : b))
      setMessage('Borrowing history cleared successfully')
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch (error) {
      const backendMsg = error.response?.data?.error
      setMessage(backendMsg || 'Could not clear history')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleUpdateBook = async (bookId, updatedData) => {
    try {
      const updatedBook = await bookService.update(bookId, updatedData)
      setBooks(books.map(b => b.id === bookId ? updatedBook : b))
      setMessage('Book updated successfully')
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch (error) {
      const backendMsg = error.response?.data?.error
      setMessage(backendMsg || 'Could not update book')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleDeleteBook = async (bookId) => {
    try {
      await bookService.remove(bookId)
      setBooks(books.filter(b => b.id !== bookId))
      setMessage('Book deleted successfully')
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch (error) {
      const backendMsg = error.response?.data?.error
      setMessage(backendMsg || 'Could not delete book')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <div className="library-container">
      <h2>Campus da Terra Library</h2>

      <div className="books-grid">
        {books.map(book =>
          <Book key={book.id} book={book} user={user} onBorrow={handleBorrow} onReturn={handleReturn} onClearHistory={handleClearHistory} onUpdateBook={handleUpdateBook} onDeleteBook={handleDeleteBook} />
        )}
      </div>

      {user && user.role === 'admin' && (
        <div style={{ marginTop: '2rem' }}>
          <button onClick={() => setShowCreateForm(true)}>
            Add Book
          </button>
        </div>
      )}

      {showCreateForm && createPortal(
        <div className="form-popup-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="form-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Add New Book</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            <div className="history-content">
              <BookForm createBook={addBook} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default Library