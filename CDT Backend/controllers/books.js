const booksRouter = require('express').Router()
const Book = require('../models/book')
const { userExtractor } = require('../utils/middleware')

booksRouter.get('/', async (request, response) => {
  try {
    const page = parseInt(request.query.page) || 1
    const limit = parseInt(request.query.limit) || 18
    const skip = (page - 1) * limit

    const totalBooks = await Book.countDocuments()
    const books = await Book.find({})
      .skip(skip)
      .limit(limit)
      .populate('user', { username: 1, name: 1 })
      .populate('lending.borrower', { username: 1, name: 1 })

    // Populate lendingHistory borrowers
    const User = require('../models/user')
    for (let book of books) {
      for (let historyEntry of book.lendingHistory) {
        if (historyEntry.borrower) {
          const borrowerUser = await User.findById(historyEntry.borrower).select('username name')
          historyEntry.borrower = borrowerUser
        }
      }
    }

    response.json({
      books,
      totalBooks,
      page,
      totalPages: Math.ceil(totalBooks / limit),
    })
  } catch (error) {
    console.error('Error fetching books:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})



booksRouter.post('/', userExtractor, async (request, response) => {
  if (!request.user || request.user.role !== 'admin' && request.user.role !== 'tutor') {
    return response.status(403).json({ error: 'Only admins and tutors can add books' })
  }
  const body = request.body
  if (!body.title) {
    return response.status(400).json({ error: 'Title is required' })
  }

  const book = new Book({
    title: body.title,
    author: body.author || 'Unknown Author',
    url: body.url || '',
    likes: body.likes || 0,
    user: request.user._id
  })

  const savedBook = await book.save()
  request.user.books = request.user.books.concat(savedBook._id)
  await request.user.save()
  response.status(201).json(savedBook)
})

booksRouter.delete('/:id', userExtractor, async (request, response) => {
  if (!request.user || (request.user.role !== 'admin' && request.user.role !== 'tutor')) {
    return response.status(403).json({ error: 'Only admins and tutors can delete books' })
  }


  const book = await Book.findById(request.params.id)

  if (!book) {
    return response.status(404).json({ error: 'Book not found' })
  }

  if (book.user.toString() === request.user._id.toString()) {
    await Book.findByIdAndDelete(book._id)
    response.status(204).end()
  } else {
    return response.status(403).json({ error: 'Unauthorized: can only delete your own books' })
  }
})

booksRouter.put('/:id', userExtractor, async (request, response) => {
  try {
    const { likes, title, author, url, language, difficulty } = request.body || {}

    const updateBook = await Book.findById(request.params.id)
    if (!updateBook) {
      return response.status(404).end()
    }

    // If only likes is being updated (for the like functionality)
    if (likes !== undefined && !title && !author && !url && !language && !difficulty) {
      updateBook.likes = likes
    } else {
      // Admin updating book details
      if (!request.user || (request.user.role !== 'admin' && request.user.role !== 'tutor')) {
        return response.status(403).json({ error: 'Only admins and tutors can update books' })
      }

      if (title !== undefined) updateBook.title = title
      if (author !== undefined) updateBook.author = author || 'Unknown Author'
      if (url !== undefined) updateBook.url = url
      if (language !== undefined) updateBook.language = language || ''
      if (difficulty !== undefined) {
        updateBook.difficulty = difficulty === '' ? undefined : difficulty
      }
    }

    const savedBook = await updateBook.save()

    // Populate the book after saving
    await savedBook.populate('user', { username: 1, name: 1 })
    await savedBook.populate('lending.borrower', { username: 1, name: 1 })

    // Manually populate lendingHistory borrowers
    const User = require('../models/user')
    for (let historyEntry of savedBook.lendingHistory) {
      if (historyEntry.borrower) {
        const borrowerUser = await User.findById(historyEntry.borrower).select('username name')
        historyEntry.borrower = borrowerUser
      }
    }

    response.json(savedBook)
  } catch (error) {
    console.error('Error updating book:', error)
    response.status(500).json({ error: 'Failed to update book', details: error.message })
  }
})

booksRouter.put('/:id/lend', userExtractor, async (request, response) => {
  const { userId } = request.body // For admin lending to specific user
  const isAdmin = request.user.role === 'admin'

  // Determine the borrower - if admin provides userId, use that, otherwise use requesting user
  const borrowerId = (isAdmin && userId) ? userId : request.user._id

  // If admin is lending to someone else, check their book limit instead
  const borrowedCount = await Book.countDocuments({
    'lending.isLent': true,
    'lending.borrower': borrowerId
  })

  if (borrowedCount >= 3) {
    const borrowerText = (isAdmin && userId) ? 'This user' : 'You'
    return response.status(400).json({ error: `${borrowerText} can only borrow up to 3 books at a time.` })
  }

  const book = await Book.findById(request.params.id)
  if (!book) {
    return response.status(404).json({ error: 'Book not found' })
  }

  if (book.lending.isLent) {
    return response.status(400).json({ error: 'Book is already lent out' })
  }

  const lentDate = new Date()
  const dueDate = new Date(lentDate)
  dueDate.setDate(lentDate.getDate() + 21) // 3 weeks

  book.lending = {
    isLent: true,
    borrower: borrowerId,
    lentDate: lentDate,
    dueDate: dueDate
  }

  // Add entry to lending history
  book.lendingHistory.push({
    borrower: borrowerId,
    lentDate: lentDate,
    dueDate: dueDate,
    returnedDate: null,
    isReturned: false
  })

  const savedBook = await book.save()

  // Manually populate lendingHistory borrowers for the response
  const User = require('../models/user')
  for (let historyEntry of savedBook.lendingHistory) {
    if (historyEntry.borrower) {
      const borrowerUser = await User.findById(historyEntry.borrower).select('username name')
      historyEntry.borrower = borrowerUser
    }
  }

  response.json(savedBook)
})

booksRouter.put('/:id/return', userExtractor, async (request, response) => {
  const book = await Book.findById(request.params.id)
  if (!book) {
    return response.status(404).json({ error: 'Book not found' })
  }

  if (!book.lending.isLent) {
    return response.status(400).json({ error: 'Book is not currently lent out' })
  }

  // Check if borrower exists
  if (!book.lending.borrower) {
    return response.status(400).json({ error: 'Book lending data is corrupted - no borrower found' })
  }

  // Allow borrower or admin to return
  const isBorrower = book.lending.borrower.toString() === request.user._id.toString()
  const isAdmin = request.user.role === 'admin'

  if (!isBorrower && !isAdmin) {
    return response.status(403).json({ error: 'Unauthorized: only the borrower or an admin can return this book' })
  }

  // Save the borrower ID before clearing the lending status
  const borrowerId = book.lending.borrower

  // Find the current lending entry in history and mark it as returned
  const currentHistoryEntry = book.lendingHistory.find(
    entry => entry.borrower.toString() === borrowerId.toString() && !entry.isReturned
  )

  if (currentHistoryEntry) {
    currentHistoryEntry.returnedDate = new Date()
    currentHistoryEntry.isReturned = true
  }

  book.lending = {
    isLent: false,
    borrower: null,
    lentDate: null,
    dueDate: null
  }

  const savedBook = await book.save()

  // Manually populate lendingHistory borrowers for the response
  const User = require('../models/user')
  for (let historyEntry of savedBook.lendingHistory) {
    if (historyEntry.borrower) {
      const borrowerUser = await User.findById(historyEntry.borrower).select('username name')
      historyEntry.borrower = borrowerUser
    }
  }

  response.json(savedBook)
})

booksRouter.put('/:id/clear-history', userExtractor, async (request, response) => {
  const book = await Book.findById(request.params.id)
  if (!book) {
    return response.status(404).json({ error: 'Book not found' })
  }

  // Only admins can clear history
  if (!request.user || request.user.role !== 'admin') {
    return response.status(403).json({ error: 'Only admins can clear borrowing history' })
  }

  // Clear the lending history
  book.lendingHistory = []

  const savedBook = await book.save()
  response.json(savedBook)
})


module.exports = booksRouter
