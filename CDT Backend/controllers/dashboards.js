const dashboardsRouter = require('express').Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Dashboard = require('../models/dashboard')
const Student = require('../models/student')
const { userExtractor } = require('../utils/middleware')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  // Accept PDFs and common document formats
  const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'))
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
})

// Get dashboard for a student
dashboardsRouter.get('/:studentId', userExtractor, async (request, response) => {
  try {
    const studentId = request.params.studentId

    // Check if user has permission to view this dashboard
    const student = await Student.findById(studentId)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    // Only the student's associated user or admin can view
    const isOwner = student.userId.toString() === request.user._id.toString()
    const isAdmin = request.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return response.status(403).json({ error: 'Access denied' })
    }

    // Find or create dashboard
    let dashboard = await Dashboard.findOne({ studentId }).populate('studentId', 'firstName lastName')

    if (!dashboard) {
      dashboard = new Dashboard({
        studentId,
        portfolios: [],
        documents: [],
        history: []
      })
      await dashboard.save()
      await dashboard.populate('studentId', 'firstName lastName')
    }

    response.json(dashboard)
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// Update dashboard (admin only)
dashboardsRouter.put('/:studentId', userExtractor, async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can edit dashboards' })
    }

    const studentId = request.params.studentId
    const updates = request.body

    const dashboard = await Dashboard.findOneAndUpdate(
      { studentId },
      updates,
      { new: true, runValidators: true }
    ).populate('studentId', 'firstName lastName')

    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    response.json(dashboard)
  } catch (error) {
    console.error('Error updating dashboard:', error)
    response.status(400).json({ error: error.message })
  }
})

// Upload portfolio PDF (admin only)
dashboardsRouter.post('/:studentId/portfolios', userExtractor, upload.single('portfolio'), async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can upload portfolio' })
    }

    if (!request.file) {
      return response.status(400).json({ error: 'No file uploaded' })
    }

    const studentId = request.params.studentId
    const fileUrl = `/uploads/${request.file.filename}`

    let dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      dashboard = new Dashboard({
        studentId,
        portfolios: [],
        documents: [],
        history: []
      })
    }

    // Add new portfolio to the array
    const newPortfolio = {
      pdfUrl: fileUrl,
      fileName: request.file.originalname,
      uploadDate: new Date()
    }

    dashboard.portfolios.push(newPortfolio)

    await dashboard.save()
    await dashboard.populate('studentId', 'firstName lastName')

    response.json(dashboard)
  } catch (error) {
    console.error('Error uploading portfolio:', error)
    response.status(500).json({ error: 'Failed to upload portfolio' })
  }
})

// Delete specific portfolio (admin only)
dashboardsRouter.delete('/:studentId/portfolios/:portfolioId', userExtractor, async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can delete portfolio' })
    }

    const studentId = request.params.studentId
    const portfolioId = request.params.portfolioId
    const dashboard = await Dashboard.findOne({ studentId })

    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    const portfolioIndex = dashboard.portfolios.findIndex(portfolio => portfolio._id.toString() === portfolioId)

    if (portfolioIndex === -1) {
      return response.status(404).json({ error: 'Portfolio not found' })
    }

    const portfolio = dashboard.portfolios[portfolioIndex]

    // Remove portfolio file from filesystem
    const filePath = path.join(__dirname, '..', portfolio.pdfUrl)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Remove portfolio from array
    dashboard.portfolios.splice(portfolioIndex, 1)
    await dashboard.save()
    await dashboard.populate('studentId', 'firstName lastName')

    response.json(dashboard)
  } catch (error) {
    console.error('Error deleting portfolio:', error)
    response.status(500).json({ error: 'Failed to delete portfolio' })
  }
})

// Replace specific portfolio (admin only)
dashboardsRouter.put('/:studentId/portfolios/:portfolioId', userExtractor, upload.single('portfolio'), async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can replace portfolio' })
    }

    if (!request.file) {
      return response.status(400).json({ error: 'No file uploaded' })
    }

    const studentId = request.params.studentId
    const portfolioId = request.params.portfolioId
    const fileUrl = `/uploads/${request.file.filename}`

    const dashboard = await Dashboard.findOne({ studentId })

    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    const portfolioIndex = dashboard.portfolios.findIndex(portfolio => portfolio._id.toString() === portfolioId)

    if (portfolioIndex === -1) {
      return response.status(404).json({ error: 'Portfolio not found' })
    }

    const oldPortfolio = dashboard.portfolios[portfolioIndex]

    // Remove old portfolio file from filesystem
    const oldFilePath = path.join(__dirname, '..', oldPortfolio.pdfUrl)
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath)
    }

    // Update portfolio data
    dashboard.portfolios[portfolioIndex] = {
      _id: oldPortfolio._id,
      pdfUrl: fileUrl,
      fileName: request.file.originalname,
      uploadDate: new Date()
    }

    await dashboard.save()
    await dashboard.populate('studentId', 'firstName lastName')

    response.json(dashboard)
  } catch (error) {
    console.error('Error replacing portfolio:', error)
    response.status(500).json({ error: 'Failed to replace portfolio' })
  }
})

// Add document (admin only)
dashboardsRouter.post('/:studentId/documents', userExtractor, upload.single('document'), async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can add documents' })
    }

    if (!request.file) {
      return response.status(400).json({ error: 'No file uploaded' })
    }

    const { name } = request.body
    if (!name) {
      return response.status(400).json({ error: 'Document name is required' })
    }

    const studentId = request.params.studentId
    const fileUrl = `/uploads/${request.file.filename}`

    let dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      dashboard = new Dashboard({ studentId })
    }

    dashboard.documents.push({
      name,
      url: fileUrl,
      fileName: request.file.originalname,
      uploadDate: new Date()
    })

    await dashboard.save()
    await dashboard.populate('studentId', 'firstName lastName')

    response.json(dashboard)
  } catch (error) {
    console.error('Error adding document:', error)
    response.status(500).json({ error: 'Failed to add document' })
  }
})

// Remove document (admin only)
dashboardsRouter.delete('/:studentId/documents/:documentId', userExtractor, async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can remove documents' })
    }

    const { studentId, documentId } = request.params

    const dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    const document = dashboard.documents.id(documentId)
    if (!document) {
      return response.status(404).json({ error: 'Document not found' })
    }

    // Remove file from filesystem
    const filePath = path.join(__dirname, '..', document.url)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    dashboard.documents.pull(documentId)
    await dashboard.save()
    await dashboard.populate('studentId', 'firstName lastName')

    response.json(dashboard)
  } catch (error) {
    console.error('Error removing document:', error)
    response.status(500).json({ error: 'Failed to remove document' })
  }
})

// Add history event (admin only)
dashboardsRouter.post('/:studentId/history', userExtractor, async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can add history events' })
    }

    const studentId = request.params.studentId
    const { type, date, month, year, paymentStatus, downloadUrl, description } = request.body

    if (!type || !date) {
      return response.status(400).json({ error: 'Type and date are required' })
    }

    let dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      dashboard = new Dashboard({ studentId })
    }

    dashboard.history.push({
      type,
      date: new Date(date),
      month,
      year,
      paymentStatus: paymentStatus || 'not_paid',
      downloadUrl,
      description
    })

    // Sort history by date
    dashboard.history.sort((a, b) => new Date(a.date) - new Date(b.date))

    await dashboard.save()
    await dashboard.populate('studentId', 'firstName lastName')

    response.json(dashboard)
  } catch (error) {
    console.error('Error adding history event:', error)
    response.status(400).json({ error: error.message })
  }
})

// Remove history event (admin only)
dashboardsRouter.delete('/:studentId/history/:historyId', userExtractor, async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can remove history events' })
    }

    const { studentId, historyId } = request.params

    const dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    dashboard.history.pull(historyId)
    await dashboard.save()
    await dashboard.populate('studentId', 'firstName lastName')

    response.json(dashboard)
  } catch (error) {
    console.error('Error removing history event:', error)
    response.status(500).json({ error: 'Failed to remove history event' })
  }
})

// Upload invoice file (admin only)
dashboardsRouter.post('/:studentId/history/:historyId/receipt', userExtractor, upload.single('receiptFile'), async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can upload invoices' })
    }

    if (!request.file) {
      return response.status(400).json({ error: 'Invoice file is required' })
    }

    const { studentId, historyId } = request.params
    const fileUrl = `/uploads/${request.file.filename}`

    const dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    const historyEvent = dashboard.history.id(historyId)
    if (!historyEvent) {
      return response.status(404).json({ error: 'History event not found' })
    }

    if (historyEvent.type !== 'receipt') {
      return response.status(400).json({ error: 'Can only upload invoices for receipt events' })
    }

    // Remove old file if it exists
    if (historyEvent.downloadUrl) {
      const oldFilePath = path.join('uploads', path.basename(historyEvent.downloadUrl))
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath)
      }
    }

    // Update the history event with the file URL
    historyEvent.downloadUrl = fileUrl
    historyEvent.fileName = request.file.originalname

    await dashboard.save()
    await dashboard.populate('studentId', 'firstName lastName')

    response.json(dashboard)
  } catch (error) {
    console.error('Error uploading invoice:', error)
    response.status(500).json({ error: 'Failed to upload invoice' })
  }
})

// Delete invoice file (admin only)
dashboardsRouter.delete('/:studentId/history/:historyId/receipt', userExtractor, async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can delete invoices' })
    }

    const { studentId, historyId } = request.params

    const dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    const historyEvent = dashboard.history.id(historyId)
    if (!historyEvent) {
      return response.status(404).json({ error: 'History event not found' })
    }

    if (!historyEvent.downloadUrl) {
      return response.status(400).json({ error: 'No invoice file to delete' })
    }

    // Remove file from filesystem
    const filePath = path.join('uploads', path.basename(historyEvent.downloadUrl))
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Remove the file URL from the history event
    historyEvent.downloadUrl = undefined
    historyEvent.fileName = undefined

    await dashboard.save()
    await dashboard.populate('studentId', 'firstName lastName')

    response.json(dashboard)
  } catch (error) {
    console.error('Error deleting invoice:', error)
    response.status(500).json({ error: 'Failed to delete invoice' })
  }
})

module.exports = dashboardsRouter