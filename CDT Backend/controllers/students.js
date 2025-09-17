const jwt = require('jsonwebtoken')
const studentsRouter = require('express').Router()
const Student = require('../models/student')
const User = require('../models/user')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

// GET all students for the authenticated user
studentsRouter.get('/', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const user = await User.findById(decodedToken.id)
    if (!user) {
      return response.status(404).json({ error: 'user not found' })
    }

    // If admin, return all students; otherwise return only user's students
    let students
    if (user.role === 'admin') {
      students = await Student.find({}).populate('userId', { username: 1, name: 1, email: 1 })
    } else {
      students = await Student.find({ userId: decodedToken.id })
    }

    response.json(students)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'token invalid' })
    }
    console.error('Error fetching students:', error)
    response.status(500).json({ error: 'internal server error' })
  }
})

// GET specific student by ID
studentsRouter.get('/:id', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const student = await Student.findById(request.params.id).populate('userId', { username: 1, name: 1, email: 1 })
    if (!student) {
      return response.status(404).json({ error: 'student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: user can only access their own students unless they're admin
    if (user.role !== 'admin' && student.userId.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'permission denied' })
    }

    response.json(student)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'malformatted id' })
    }
    console.error('Error fetching student:', error)
    response.status(500).json({ error: 'internal server error' })
  }
})

// POST create new student
studentsRouter.post('/', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const user = await User.findById(decodedToken.id)
    if (!user) {
      return response.status(404).json({ error: 'user not found' })
    }

    // For admin users, allow specifying a different userId, otherwise use the authenticated user's ID
    let targetUserId = decodedToken.id
    if (user.role === 'admin' && request.body.userId) {
      targetUserId = request.body.userId
    }

    const studentData = {
      ...request.body,
      userId: targetUserId
    }

    const student = new Student(studentData)
    const savedStudent = await student.save()

    // Add student reference to the target user's students array
    const targetUser = targetUserId === decodedToken.id ? user : await User.findById(targetUserId)
    if (!targetUser) {
      return response.status(404).json({ error: 'target user not found' })
    }

    if (!targetUser.students) {
      targetUser.students = []
    }
    targetUser.students = targetUser.students.concat(savedStudent._id)
    await targetUser.save()

    response.status(201).json(savedStudent)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'token invalid' })
    }
    if (error.name === 'TokenExpiredError') {
      return response.status(401).json({ error: 'token expired' })
    }
    if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
    }
    console.error('Error creating student:', error)
    response.status(500).json({ error: 'internal server error' })
  }
})

// PUT update student
studentsRouter.put('/:id', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const student = await Student.findById(request.params.id)
    if (!student) {
      return response.status(404).json({ error: 'student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: user can only update their own students unless they're admin
    if (user.role !== 'admin' && student.userId.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'permission denied' })
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true, runValidators: true }
    )

    response.json(updatedStudent)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'token invalid' })
    }
    if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'malformatted id' })
    }
    console.error('Error updating student:', error)
    response.status(500).json({ error: 'internal server error' })
  }
})

// DELETE student
studentsRouter.delete('/:id', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const student = await Student.findById(request.params.id)
    if (!student) {
      return response.status(404).json({ error: 'student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: user can only delete their own students unless they're admin
    if (user.role !== 'admin' && student.userId.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'permission denied' })
    }

    await Student.findByIdAndDelete(request.params.id)

    // Remove student reference from user's students array
    user.students = user.students.filter(s => s.toString() !== request.params.id)
    await user.save()

    response.status(204).end()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'malformatted id' })
    }
    console.error('Error deleting student:', error)
    response.status(500).json({ error: 'internal server error' })
  }
})

module.exports = studentsRouter