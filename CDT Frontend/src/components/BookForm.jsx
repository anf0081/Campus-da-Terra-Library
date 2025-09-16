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
    <div>
      <h2>Create new book</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Title: &nbsp;
            <input
              type="text"
              value={title}
              onChange={({ target }) => setTitle(target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Author: &nbsp;
            <input
              type="text"
              value={author}
              onChange={({ target }) => setAuthor(target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            URL: &nbsp;
            <input
              type="url"
              value={url}
              onChange={({ target }) => setUrl(target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">create</button>
      </form>
    </div>
  )
}

export default BookForm