const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const usersRouter = require('express').Router()
const User = require('../models/user')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

usersRouter.get('/', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const requestingUser = await User.findById(decodedToken.id)
    if (!requestingUser || requestingUser.role !== 'admin') {
      return response.status(403).json({ error: 'Permission denied - admin access required' })
    }

    const users = await User.find({})
      .populate('books', { url: 1, title: 1, author: 1 })
      .populate('students')
    response.json(users)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    console.error('Error fetching users:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})


usersRouter.post('/', async (request, response) => {
  const { username, name, email, password, role } = request.body

  if (!password || password.length < 3) {
    return response.status(400).json({ error: 'Password must be at least 3 characters long.' })
  }

  if (!username || username.length < 3) {
    return response.status(400).json({ error: 'Username must be at least 3 characters long.' })
  }

  if (!email) {
    return response.status(400).json({ error: 'Email is required.' })
  }

  const existingUser = await User.findOne({ username })
  if (existingUser) {
    return response.status(400).json({ error: 'Username must be unique' })
  }

  const existingEmail = await User.findOne({ email })
  if (existingEmail) {
    return response.status(400).json({ error: 'Email must be unique' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    email,
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
      if (error.keyPattern?.username) {
        return response.status(400).json({ error: 'Username must be unique' })
      }
      if (error.keyPattern?.email) {
        return response.status(400).json({ error: 'Email must be unique' })
      }
      return response.status(400).json({ error: 'Duplicate key error' })
    }
    throw error
  }
})

usersRouter.put('/:id', async (request, response) => {
  console.log('PUT /api/users/:id - Request body:', request.body)
  const {
    name,
    email,
    password,
    contactNumber,
    parentStreetAddress,
    parentCity,
    parentPostalCode,
    parentCountry,
    parentNationality,
    parentPassportNumber,
    parentPassportExpiryDate,
    parentNifNumber,
    emergencyContactRelationship,
    emergencyContactName,
    emergencyContactNumber
  } = request.body
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    // Check if user is updating their own profile or is admin
    if (decodedToken.id !== request.params.id) {
      const requestingUser = await User.findById(decodedToken.id)
      if (!requestingUser || requestingUser.role !== 'admin') {
        return response.status(403).json({ error: 'Permission denied' })
      }
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email

    // Handle password update with hashing
    if (password && password.trim()) {
      if (password.length < 3) {
        return response.status(400).json({ error: 'Password must be at least 3 characters long.' })
      }
      const saltRounds = 10
      updateData.passwordHash = await bcrypt.hash(password, saltRounds)
    }
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber
    if (parentStreetAddress !== undefined) updateData.parentStreetAddress = parentStreetAddress
    if (parentCity !== undefined) updateData.parentCity = parentCity
    if (parentPostalCode !== undefined) updateData.parentPostalCode = parentPostalCode
    if (parentCountry !== undefined) updateData.parentCountry = parentCountry
    if (parentNationality !== undefined) updateData.parentNationality = parentNationality
    if (parentPassportNumber !== undefined) updateData.parentPassportNumber = parentPassportNumber
    if (parentPassportExpiryDate !== undefined) updateData.parentPassportExpiryDate = parentPassportExpiryDate
    if (parentNifNumber !== undefined) updateData.parentNifNumber = parentNifNumber
    if (emergencyContactRelationship !== undefined) updateData.emergencyContactRelationship = emergencyContactRelationship
    if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName
    if (emergencyContactNumber !== undefined) updateData.emergencyContactNumber = emergencyContactNumber

    console.log('Update data to be saved:', updateData)

    const updatedUser = await User.findByIdAndUpdate(
      request.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return response.status(404).json({ error: 'User not found' })
    }

    console.log('User updated successfully:', updatedUser._id)
    response.json(updatedUser)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
    }
    if (error.code === 11000) {
      return response.status(400).json({ error: 'Email must be unique' })
    }
    console.error('Error updating user:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE user
usersRouter.delete('/:id', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const requestingUser = await User.findById(decodedToken.id)
    if (!requestingUser || requestingUser.role !== 'admin') {
      return response.status(403).json({ error: 'Permission denied - admin access required' })
    }

    const userToDelete = await User.findById(request.params.id)
    if (!userToDelete) {
      return response.status(404).json({ error: 'User not found' })
    }

    // Prevent admin from deleting themselves
    if (decodedToken.id === request.params.id) {
      return response.status(400).json({ error: 'Cannot delete your own account' })
    }

    await User.findByIdAndDelete(request.params.id)
    response.status(204).end()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'Malformatted id' })
    }
    console.error('Error deleting user:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = usersRouter
