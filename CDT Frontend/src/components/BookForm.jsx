import { useState } from 'react'

const BookForm = ({ createBook }) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState('')
  const [difficulty, setDifficulty] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    createBook({
      title,
      author,
      url,
      language,
      difficulty
    })
    setTitle('')
    setAuthor('')
    setUrl('')
    setLanguage('')
    setDifficulty('')
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
      <div className="form-group">
        <label htmlFor="create-book-language">Language:</label>
        <input
          id="create-book-language"
          type="text"
          value={language}
          onChange={({ target }) => setLanguage(target.value)}
          placeholder="e.g., English, Portuguese, Spanish"
        />
      </div>
      <div className="form-group">
        <label htmlFor="create-book-difficulty">Reading Difficulty:</label>
        <select
          id="create-book-difficulty"
          value={difficulty}
          onChange={({ target }) => setDifficulty(target.value)}
        >
          <option value="">Select difficulty level...</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
      </div>
      <div className="form-actions">
        <button type="submit">Create Book</button>
      </div>
    </form>
  )
}

export default BookForm