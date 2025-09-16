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
    <div className="book-form-container">
      <h2>Create new book</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title:
          <input
            type="text"
            value={title}
            onChange={({ target }) => setTitle(target.value)}
            required
          />
        </label>
        <label>
          Author:
          <input
            type="text"
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
            required
          />
        </label>
        <label>
          Image URL:
          <input
            type="url"
            value={url}
            onChange={({ target }) => setUrl(target.value)}
            required
          />
        </label>
        <button type="submit">Create</button>
      </form>
    </div>
  )
}

export default BookForm