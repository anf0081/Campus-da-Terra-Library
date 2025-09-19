const jwt = require('jsonwebtoken')
const studentsRouter = require('express').Router()
const Student = require('../models/student')
const User = require('../models/user')
const { uploadProfilePicture, deleteImage, getPublicIdFromUrl, getSignedUrlFromStoredUrl } = require('../utils/cloudinary')

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
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const user = await User.findById(decodedToken.id)
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
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
      return response.status(401).json({ error: 'Token invalid' })
    }
    console.error('Error fetching students:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// GET specific student by ID
studentsRouter.get('/:id', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const student = await Student.findById(request.params.id).populate('userId', { username: 1, name: 1, email: 1 })
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: user can only access their own students unless they're admin
    if (user.role !== 'admin' && student.userId.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'Permission denied' })
    }

    response.json(student)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'Malformatted id' })
    }
    console.error('Error fetching student:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// POST create new student
studentsRouter.post('/', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const user = await User.findById(decodedToken.id)
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
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
      return response.status(404).json({ error: 'Target user not found' })
    }

    if (!targetUser.students) {
      targetUser.students = []
    }
    targetUser.students = targetUser.students.concat(savedStudent._id)
    await targetUser.save()

    response.status(201).json(savedStudent)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.name === 'TokenExpiredError') {
      return response.status(401).json({ error: 'Token expired' })
    }
    if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
    }
    console.error('Error creating student:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// PUT update student
studentsRouter.put('/:id', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const student = await Student.findById(request.params.id)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: user can only update their own students unless they're admin
    if (user.role !== 'admin' && student.userId.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'Permission denied' })
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true, runValidators: true }
    )

    response.json(updatedStudent)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'Malformatted id' })
    }
    console.error('Error updating student:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE student
studentsRouter.delete('/:id', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const student = await Student.findById(request.params.id)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: user can only delete their own students unless they're admin
    if (user.role !== 'admin' && student.userId.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'Permission denied' })
    }

    await Student.findByIdAndDelete(request.params.id)

    // Remove student reference from user's students array
    user.students = user.students.filter(s => s.toString() !== request.params.id)
    await user.save()

    response.status(204).end()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'Malformatted id' })
    }
    console.error('Error deleting student:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// Add book to student's wishlist
studentsRouter.post('/:id/wishlist', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const { bookId } = request.body
    if (!bookId) {
      return response.status(400).json({ error: 'Book Id is required' })
    }

    const student = await Student.findById(request.params.id)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: user can only modify their own students' wishlists unless they're admin
    if (user.role !== 'admin' && student.userId.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'Permission denied' })
    }

    // Check if book is already in wishlist
    const isAlreadyInWishlist = student.wishlist.some(item => item.bookId.toString() === bookId)
    if (isAlreadyInWishlist) {
      return response.status(400).json({ error: 'Book already in wishlist' })
    }

    // Add book to wishlist
    student.wishlist.push({ bookId })
    await student.save()

    // Populate the wishlist with book details for response
    await student.populate('wishlist.bookId')

    response.status(201).json(student.wishlist)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'Malformatted id' })
    }
    console.error('Error adding to wishlist:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// Remove book from student's wishlist
studentsRouter.delete('/:id/wishlist/:bookId', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const student = await Student.findById(request.params.id)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: user can only modify their own students' wishlists unless they're admin
    if (user.role !== 'admin' && student.userId.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'Permission denied' })
    }

    // Remove book from wishlist
    student.wishlist = student.wishlist.filter(item => item.bookId.toString() !== request.params.bookId)
    await student.save()

    // Populate the wishlist with book details for response
    await student.populate('wishlist.bookId')

    response.json(student.wishlist)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'Malformatted id' })
    }
    console.error('Error removing from wishlist:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// Get student's wishlist
studentsRouter.get('/:id/wishlist', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const student = await Student.findById(request.params.id).populate('wishlist.bookId')
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: user can only view their own students' wishlists unless they're admin
    if (user.role !== 'admin' && student.userId.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'Permission denied' })
    }

    response.json(student.wishlist)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'Malformatted id' })
    }
    console.error('Error getting wishlist:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// Upload profile picture
studentsRouter.post('/:id/profile-picture', uploadProfilePicture.single('profilePicture'), async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const student = await Student.findById(request.params.id)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: only admin can upload profile pictures
    if (user.role !== 'admin') {
      return response.status(403).json({ error: 'Only administrators can upload profile pictures' })
    }

    if (!request.file) {
      return response.status(400).json({ error: 'No file uploaded' })
    }

    // Delete old profile picture from Cloudinary if it exists
    if (student.profilePicture) {
      const oldPublicId = getPublicIdFromUrl(student.profilePicture)
      if (oldPublicId) {
        try {
          await deleteImage(oldPublicId)
        } catch (error) {
          console.error('Error deleting old profile picture:', error)
          // Continue with upload even if deletion fails
        }
      }
    }

    // Update student with new profile picture URL
    const updatedStudent = await Student.findByIdAndUpdate(
      request.params.id,
      { profilePicture: request.file.path }, // Cloudinary URL
      { new: true, runValidators: true }
    )

    response.json(updatedStudent)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'Malformatted id' })
    }
    console.error('Error uploading profile picture:', error)
    response.status(500).json({ error: 'Failed to upload profile picture' })
  }
})

// Remove profile picture
studentsRouter.delete('/:id/profile-picture', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const student = await Student.findById(request.params.id)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: only admin can remove profile pictures
    if (user.role !== 'admin') {
      return response.status(403).json({ error: 'Only administrators can remove profile pictures' })
    }

    if (!student.profilePicture) {
      return response.status(400).json({ error: 'No profile picture to remove' })
    }

    // Delete profile picture from Cloudinary
    const publicId = getPublicIdFromUrl(student.profilePicture)
    if (publicId) {
      try {
        await deleteImage(publicId)
      } catch (error) {
        console.error('Error deleting profile picture from Cloudinary:', error)
        // Continue with database update even if Cloudinary deletion fails
      }
    }

    // Remove profile picture from student record
    const updatedStudent = await Student.findByIdAndUpdate(
      request.params.id,
      { $unset: { profilePicture: 1 } },
      { new: true }
    )

    response.json(updatedStudent)
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'Malformatted id' })
    }
    console.error('Error removing profile picture:', error)
    response.status(500).json({ error: 'Failed to remove profile picture' })
  }
})

// Get secure profile picture URL
studentsRouter.get('/:id/profile-picture', async (request, response) => {
  const token = getTokenFrom(request)

  if (!token) {
    return response.status(401).json({ error: 'Token missing' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' })
    }

    const student = await Student.findById(request.params.id)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const user = await User.findById(decodedToken.id)

    // Check permissions: user can only view their own students' pictures unless they're admin
    if (user.role !== 'admin' && student.userId.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'Permission denied' })
    }

    if (!student.profilePicture) {
      return response.status(404).json({ error: 'No profile picture found' })
    }

    // Generate signed URL for the private image
    let signedUrl
    try {
      signedUrl = getSignedUrlFromStoredUrl(student.profilePicture, {
        expiresIn: 3600 // 1 hour expiration
      })
    } catch (urlError) {
      console.error('Error in getSignedUrlFromStoredUrl:', urlError)
      return response.status(500).json({ error: 'Failed to generate secure image URL' })
    }

    if (!signedUrl) {
      console.error('Failed to generate signed URL for profile picture:', student.profilePicture)
      return response.status(500).json({ error: 'Failed to generate secure image URL' })
    }

    response.json({
      url: signedUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: 'Token invalid' })
    }
    if (error.kind === 'ObjectId') {
      return response.status(400).json({ error: 'Malformatted id' })
    }
    console.error('Error getting profile picture:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = studentsRouter