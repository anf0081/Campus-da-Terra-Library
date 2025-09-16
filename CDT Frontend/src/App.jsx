import { useState, useEffect } from 'react'
import Header from './components/Header'
import Book from './components/Book'
import LoginForm from './components/LoginForm'
import BookForm from './components/BookForm'
import bookService from './services/books'
import loginService from './services/login'
import Notification from './components/Notification'
import Togglable from './components/Toggable'

const App = () => {
  const [books, setBooks] = useState([])
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null) 
  const [className, setClassName] = useState('error')

  useEffect(() => {
    bookService.getAll().then(books =>
      setBooks( books )
    )  
  }, [])

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedBooklistUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      bookService.setToken(user.token)
    }
  }, [])
  

  const handleLogin = async event => {
    event.preventDefault()
    try {
      const user = await loginService.login({ username, password })
      window.localStorage.setItem(
        'loggedBooklistUser', JSON.stringify(user)
      ) 
      
      bookService.setToken(user.token)
      setUser(user)
      setUsername('')
      setPassword('')
      bookService.setToken(user.token)
      setMessage('Login successful')
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch {
      setMessage('Wrong username or password')
      setTimeout(() => {
        setMessage(null)
      }, 5000)
    }
  }

  const handleLogout = () => {
    window.localStorage.removeItem('loggedBooklistUser')
    setUser(null)
    bookService.setToken(null)
    setMessage('Logged out successfully')
    setClassName('success')
    setTimeout(() => {
      setMessage(null)
      setClassName('error')
    }, 5000)
  }

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
      <Header />
      <Notification message={message} type={className} />
      <main className="main-content">
        <div>
          <h2>Campus da Terra Library</h2>
          {books.map(book =>
            <Book key={book.id} book={book} user={user} onBorrow={handleBorrow} onReturn={handleReturn} />
          )}
        </div>
        <div>
          {!user &&
          <Togglable buttonLabel='Login'>
            <LoginForm
            handleLogin={handleLogin}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            />
          </Togglable>
      }

           {user && user.role === 'admin' && (
            <Togglable buttonLabel="Add Book">
              <BookForm createBook={addBook} />
            </Togglable>
          )}

          {user && (
          <div>
            <p>"{user.name}" logged in</p>
            <button onClick={() => handleLogout()}>logout</button>
          </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default App