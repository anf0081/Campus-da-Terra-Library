import { useState, useEffect } from 'react'
import Book from './Book'
import BookForm from './BookForm'
import Togglable from './Toggable'
import bookService from '../services/books'

const Library = ({ user, setMessage, setClassName }) => {
  const [books, setBooks] = useState([])

  useEffect(() => {
    bookService.getAll().then(books =>
      setBooks(books)
    )
  }, [])

  const addBook = async (bookObject) => {
    try {
      const returnedBook = await bookService.create(bookObject)
      setBooks(books.concat(returnedBook))
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

  return (
    <div>
      <h2>Campus da Terra Library</h2>
      {books.map(book =>
        <Book key={book.id} book={book} user={user} onBorrow={handleBorrow} onReturn={handleReturn} />
      )}

      {user && user.role === 'admin' && (
        <div style={{ marginTop: '2rem' }}>
          <Togglable buttonLabel="Add Book">
            <BookForm createBook={addBook} />
          </Togglable>
        </div>
      )}
    </div>
  )
}

export default Library