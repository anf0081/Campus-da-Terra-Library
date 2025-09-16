const booksRouter = require('express').Router()
const Book = require('../models/book')
const { userExtractor } = require('../utils/middleware')

booksRouter.get('/', async (request, response) => {
  const books = await Book.find({}).populate('user', { username: 1, name: 1 })
  response.json(books)
})


booksRouter.post('/', userExtractor, async (request, response) => {
  if (!request.user || request.user.role !== 'admin' && request.user.role !== 'tutor') {
    return response.status(403).json({ error: 'only admins and tutors can add books' })
  }
  const body = request.body
  if (!body.title || !body.url) {
    return response.status(400).json({ error: 'title and url are required' })
  }

  const book = new Book({
    title: body.title,
    author: body.author || 'Unknown Author',
    url: body.url,
    likes: body.likes || 0,
    user: request.user._id
  })

  const savedBook = await book.save()
  request.user.books = request.user.books.concat(savedBook._id)
  await request.user.save()
  response.status(201).json(savedBook)
})

booksRouter.delete('/:id', userExtractor, async (request, response) => {
  if (!request.user || request.user.role !== 'admin' || request.user.role !== 'tutor') {
    return response.status(403).json({ error: 'only admins and tutors can add books' })
  }

  const book = await Book.findById(request.params.id)

  if (!book) {
    return response.status(404).json({ error: 'book not found' })
  }

  if (book.user.toString() === request.user._id.toString()) {
    await Book.findByIdAndDelete(book._id)
    response.status(204).end()
  } else {
    return response.status(403).json({ error: 'unauthorized: can only delete your own books' })
  }
})

booksRouter.put('/:id', async (request, response) => {
  const { likes } = request.body

  const updateBook = await Book.findById(request.params.id)
  if (!updateBook) {
    return response.status(404).end()
  }
  updateBook.likes = likes

  const savedBook = await updateBook.save()
  response.json(savedBook)
})

booksRouter.put('/:id/lend', userExtractor, async (request, response) => {

  const borrowedCount = await Book.countDocuments({
    'lending.isLent': true,
    'lending.borrower': request.user._id
  })

  if (borrowedCount >= 3) {
    return response.status(400).json({ error: 'You can only borrow up to 3 books at a time.' })
  }
  const book = await Book.findById(request.params.id)
  if (!book) {
    return response.status(404).json({ error: 'book not found' })
  }

  if (book.lending.isLent) {
    return response.status(400).json({ error: 'book is already lent out' })
  }

  const lentDate = new Date()
  const dueDate = new Date(lentDate)
  dueDate.setDate(lentDate.getDate() + 21) // 3 weeks

  book.lending = {
    isLent: true,
    borrower: request.user._id,
    lentDate: lentDate,
    dueDate: dueDate
  }

  // Add entry to lending history
  book.lendingHistory.push({
    borrower: request.user._id,
    lentDate: lentDate,
    dueDate: dueDate,
    returnedDate: null,
    isReturned: false
  })

  const savedBook = await book.save()
  response.json(savedBook)
})

booksRouter.put('/:id/return', userExtractor, async (request, response) => {
  const book = await Book.findById(request.params.id)
  if (!book) {
    return response.status(404).json({ error: 'book not found' })
  }

  if (!book.lending.isLent) {
    return response.status(400).json({ error: 'book is not currently lent out' })
  }

  // Allow borrower or admin to return
  const isBorrower = book.lending.borrower.toString() === request.user._id.toString()
  const isAdmin = request.user.role === 'admin'

  if (!isBorrower && !isAdmin) {
    return response.status(403).json({ error: 'unauthorized: only the borrower or an admin can return this book' })
  }

  // Find the current lending entry in history and mark it as returned
  const currentHistoryEntry = book.lendingHistory.find(
    entry => entry.borrower.toString() === request.user._id.toString() && !entry.isReturned
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
  response.json(savedBook)
})


module.exports = booksRouter
