import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Book from './Book'
import BookForm from './BookForm'
import bookService from '../services/books'
import userService from '../services/users'
import studentService from '../services/students'

const Library = ({ user, setMessage, setClassName }) => {
  const [books, setBooks] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [users, setUsers] = useState([])
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')

  useEffect(() => {
    setLoading(true)
    bookService.getAll({ page, limit: 18 })
      .then(data => {
        setBooks(data.books)
        setTotalPages(data.totalPages)
      })
      .catch(error => {
        console.error('Error fetching books:', error)
        setBooks([])
      })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    if (user?.role === 'admin') {
      userService.getAll()
        .then(setUsers)
        .catch(error => {
          console.error('Error fetching users:', error)
          setUsers([])
        })
    }
  }, [user])

  useEffect(() => {
    if (user && user.role !== 'admin') {
      studentService.getAll()
        .then(setStudents)
        .catch(error => {
          console.error('Error fetching students:', error)
          setStudents([])
        })
    }
  }, [user])

  const uniqueLanguages = useMemo(() => {
    const languages = books
      .map(book => book.language)
      .filter(lang => lang && lang.trim() !== '')
    return [...new Set(languages)].sort()
  }, [books])

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = searchTerm === '' ||
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLanguage = selectedLanguage === '' ||
        book.language === selectedLanguage

      const matchesDifficulty = selectedDifficulty === '' ||
        book.difficulty === selectedDifficulty

      return matchesSearch && matchesLanguage && matchesDifficulty
    })
  }, [books, searchTerm, selectedLanguage, selectedDifficulty])

  if (loading) return <div className="loading">Loading books...</div>

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
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleAction = async (action, bookId, data) => {
    try {
      let updatedBook
      switch (action) {
        case 'borrow':
          updatedBook = await bookService.lend(bookId)
          setMessage('Book borrowed for 3 weeks')
          break
        case 'lendTo': {
          updatedBook = await bookService.lend(bookId, data.userId)
          const borrowerName = users.find(u => u.id === data.userId)?.name || 'User'
          setMessage(`Book lent to ${borrowerName} for 3 weeks`)
          break
        }
        case 'return':
          updatedBook = await bookService.returnBook(bookId)
          setMessage('Book returned successfully')
          break
        case 'clearHistory':
          updatedBook = await bookService.clearHistory(bookId)
          setMessage('Borrowing history cleared successfully')
          break
        case 'update':
          updatedBook = await bookService.update(bookId, data)
          setMessage('Book updated successfully')
          break
        case 'delete':
          await bookService.remove(bookId)
          setBooks(books.filter(b => b.id !== bookId))
          setMessage('Book deleted successfully')
          setClassName('success')
          setTimeout(() => setMessage(null), 5000)
          return
        default:
          return
      }
      if (updatedBook) setBooks(books.map(b => b.id === bookId ? updatedBook : b))
      setClassName('success')
    } catch (error) {
      const backendMsg = error.response?.data?.error
      setMessage(backendMsg || 'Action failed')
      setClassName('error')
    } finally {
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleAddToWishlist = async (studentId, bookId) => {
    try {
      await studentService.addToWishlist(studentId, bookId)
      setMessage('Book added to wishlist successfully')
      setClassName('success')
    } catch (error) {
      const backendMsg = error.response?.data?.error
      setMessage(backendMsg || 'Failed to add book to wishlist')
      setClassName('error')
    } finally {
      setTimeout(() => setMessage(null), 5000)
    }
  }

const borrowedBooks = (user?.role === 'admin')
  ? filteredBooks.filter(b => b.lending.isLent)
  : (user ? filteredBooks.filter(b => b.lending.borrower?.id === user.id) : [])

const availableBooks = filteredBooks.filter(b => !borrowedBooks.includes(b))


  return (
    <div className="library-container">
      <div className="library-header">
        <h2 className="library-title">Campus da Terra Library</h2>
        <div className="library-controls">
          <input
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="filter-select"
          >
            <option value="">All Languages</option>
            {uniqueLanguages.map(language => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="filter-select"
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
          {user && user.role === 'admin' && (
            <button className="outlined" onClick={() => setShowCreateForm(true)}>Add New Book</button>
          )}
        </div>
      </div>

      {borrowedBooks.length > 0 && (
        <div className="borrowed-books">
          <h3>Borrowed Books</h3>
          <div className="books-grid">
            {borrowedBooks.map(book =>
              <Book
                key={book.id}
                book={book}
                user={user}
                users={users}
                students={students}
                onBorrow={() => handleAction('borrow', book.id)}
                onLendTo={(userId) => handleAction('lendTo', book.id, { userId })}
                onReturn={() => handleAction('return', book.id)}
                onClearHistory={() => handleAction('clearHistory', book.id)}
                onUpdateBook={(data) => handleAction('update', book.id, data)}
                onDeleteBook={() => handleAction('delete', book.id)}
                onAddToWishlist={handleAddToWishlist}
              />
            )}
          </div>
        </div>
      )}

      <div className="available-books">
        {borrowedBooks.length > 0 && (
        <h3>Available Books</h3>
        )}
        {borrowedBooks.length === 0 && (
        <h3>All Books</h3>
        )}
        <div className="books-grid">
          {availableBooks.map(book =>
            <Book
              key={book.id}
              book={book}
              user={user}
              users={users}
              students={students}
              onBorrow={() => handleAction('borrow', book.id)}
              onLendTo={(userId) => handleAction('lendTo', book.id, { userId })}
              onReturn={() => handleAction('return', book.id)}
              onClearHistory={() => handleAction('clearHistory', book.id)}
              onUpdateBook={(data) => handleAction('update', book.id, data)}
              onDeleteBook={() => handleAction('delete', book.id)}
              onAddToWishlist={handleAddToWishlist}
            />
          )}
        </div>
      </div>

      <div className="pagination">
        <button className="pagination-arrow" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{'<'}</button>
        <span>Page {page} of {totalPages}</span>
        <button className="pagination-arrow" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{'>'}</button>
      </div>

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
