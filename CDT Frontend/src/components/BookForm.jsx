import { useState } from 'react'

const BookForm = ({ createBook }) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [url, setUrl] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    createBook({
      title,
      author,
      url
    })
    setTitle('')
    setAuthor('')
    setUrl('')
  }

  return (
    <form onSubmit={handleSubmit} className="edit-book-form">
      <div className="form-group">
        <label htmlFor="create-book-title">Title:</label>
        <input
          id="create-book-title"
          type="text"
          value={title}
          onChange={({ target }) => setTitle(target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="create-book-author">Author:</label>
        <input
          id="create-book-author"
          type="text"
          value={author}
          onChange={({ target }) => setAuthor(target.value)}
          placeholder="Unknown Author"
        />
      </div>
      <div className="form-group">
        <label htmlFor="create-book-url">Cover Image URL:</label>
        <input
          id="create-book-url"
          type="url"
          value={url}
          onChange={({ target }) => setUrl(target.value)}
        />
      </div>
      <div className="form-actions">
        <button type="submit">Create Book</button>
      </div>
    </form>
  )
}

export default BookForm