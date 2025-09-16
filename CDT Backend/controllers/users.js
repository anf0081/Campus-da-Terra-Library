const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('books', { url: 1, title: 1, author: 1 })
  response.json(users)
})

usersRouter.post('/', async (request, response) => {
  const { username, name, password, role } = request.body

  if (!password || password.length < 3) {
    return response.status(400).json({ error: 'Password must be at least 3 characters long.' })
  }

  if (!username || username.length < 3) {
    return response.status(400).json({ error: 'Username must be at least 3 characters long.' })
  }

  const existingUser = await User.findOne({ username })
  if (existingUser) {
    return response.status(400).json({ error: 'username must be unique' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
    role
  })

  try {
    const savedUser = await user.save()
    response.status(201).json(savedUser)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
    }
    if (error.code === 11000) {
      return response.status(400).json({ error: 'username must be unique' })
    }
    throw error
  }
})

module.exports = usersRouter
