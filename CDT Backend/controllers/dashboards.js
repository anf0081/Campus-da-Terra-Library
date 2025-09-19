const dashboardsRouter = require('express').Router()
const Dashboard = require('../models/dashboard')
const Student = require('../models/student')
const { userExtractor } = require('../utils/middleware')
const {
  uploadPortfolio,
  uploadDocument,
  uploadInvoice,
  deleteImage,
  getPublicIdFromUrl,
  getSignedDocumentUrl,
  getSignedDocumentUrlWithType,
  getSignedPDFViewUrl
} = require('../utils/cloudinary')

// Cloudinary storage configurations are imported from utils/cloudinary.js

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
dashboardsRouter.post('/:studentId/portfolios', userExtractor, uploadPortfolio.single('portfolio'), async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can upload portfolio' })
    }

    if (!request.file) {
      return response.status(400).json({ error: 'No file uploaded' })
    }

    const studentId = request.params.studentId
    const fileUrl = request.file.path // Cloudinary URL

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

    // Remove portfolio file from Cloudinary
    if (portfolio.pdfUrl) {
      try {
        const publicId = getPublicIdFromUrl(portfolio.pdfUrl)
        if (publicId) {
          await deleteImage(publicId)
        }
      } catch (error) {
        console.error('Error deleting portfolio from Cloudinary:', error)
      }
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
dashboardsRouter.put('/:studentId/portfolios/:portfolioId', userExtractor, uploadPortfolio.single('portfolio'), async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can replace portfolio' })
    }

    if (!request.file) {
      return response.status(400).json({ error: 'No file uploaded' })
    }

    const studentId = request.params.studentId
    const portfolioId = request.params.portfolioId
    const fileUrl = request.file.path // Cloudinary URL

    const dashboard = await Dashboard.findOne({ studentId })

    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    const portfolioIndex = dashboard.portfolios.findIndex(portfolio => portfolio._id.toString() === portfolioId)

    if (portfolioIndex === -1) {
      return response.status(404).json({ error: 'Portfolio not found' })
    }

    const oldPortfolio = dashboard.portfolios[portfolioIndex]

    // Remove old portfolio file from Cloudinary
    if (oldPortfolio.pdfUrl) {
      try {
        const publicId = getPublicIdFromUrl(oldPortfolio.pdfUrl)
        if (publicId) {
          await deleteImage(publicId)
        }
      } catch (error) {
        console.error('Error deleting old portfolio from Cloudinary:', error)
      }
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
dashboardsRouter.post('/:studentId/documents', userExtractor, uploadDocument.single('document'), async (request, response) => {
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
    const fileUrl = request.file.path // Cloudinary URL

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

    // Remove file from Cloudinary
    if (document.url) {
      try {
        const publicId = getPublicIdFromUrl(document.url)
        if (publicId) {
          await deleteImage(publicId)
        }
      } catch (error) {
        console.error('Error deleting document from Cloudinary:', error)
      }
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
dashboardsRouter.post('/:studentId/history/:historyId/receipt', userExtractor, uploadInvoice.single('receiptFile'), async (request, response) => {
  try {
    if (request.user.role !== 'admin') {
      return response.status(403).json({ error: 'Only admins can upload invoices' })
    }

    if (!request.file) {
      return response.status(400).json({ error: 'Invoice file is required' })
    }

    const { studentId, historyId } = request.params
    const fileUrl = request.file.path // Cloudinary URL

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

    // Remove old file from Cloudinary if it exists
    if (historyEvent.downloadUrl) {
      try {
        const publicId = getPublicIdFromUrl(historyEvent.downloadUrl)
        if (publicId) {
          await deleteImage(publicId)
        }
      } catch (error) {
        console.error('Error deleting old invoice from Cloudinary:', error)
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

    // Remove file from Cloudinary
    try {
      const publicId = getPublicIdFromUrl(historyEvent.downloadUrl)
      if (publicId) {
        await deleteImage(publicId)
      }
    } catch (error) {
      console.error('Error deleting invoice from Cloudinary:', error)
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

// Serve portfolio PDF directly for inline viewing
dashboardsRouter.get('/:studentId/portfolios/:portfolioId/view', userExtractor, async (request, response) => {
  try {
    const studentId = request.params.studentId
    const portfolioId = request.params.portfolioId

    // Check if user has permission
    if (request.user.role !== 'admin' && request.user.student.toString() !== studentId) {
      return response.status(403).json({ error: 'Access denied' })
    }

    const dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    const portfolio = dashboard.portfolios.id(portfolioId)
    if (!portfolio) {
      return response.status(404).json({ error: 'Portfolio not found' })
    }

    if (!portfolio.pdfUrl) {
      return response.status(404).json({ error: 'Portfolio file not found' })
    }

    // Check if this is an old local file URL or a Cloudinary URL
    if (portfolio.pdfUrl.startsWith('/uploads/') || !portfolio.pdfUrl.includes('cloudinary.com')) {
      return response.status(400).json({
        error: 'This portfolio uses legacy storage and needs to be re-uploaded for secure access'
      })
    }

    const publicId = getPublicIdFromUrl(portfolio.pdfUrl)

    if (!publicId) {
      console.error('Failed to extract publicId from portfolio URL:', portfolio.pdfUrl)
      return response.status(400).json({ error: 'Invalid portfolio URL format' })
    }

    const signedUrl = getSignedPDFViewUrl(publicId, { expiresIn: 3600 })

    if (!signedUrl) {
      return response.status(500).json({ error: 'Failed to generate secure URL' })
    }

    // Fetch the PDF from Cloudinary and pipe it to the response with proper headers
    const https = require('https')
    const url = require('url')

    const parsedUrl = url.parse(signedUrl)

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.path,
      method: 'GET'
    }

    const req = https.request(options, (pdfResponse) => {
      if (pdfResponse.statusCode !== 200) {
        return response.status(pdfResponse.statusCode).json({ error: 'Failed to fetch PDF' })
      }

      // Set headers for inline PDF viewing
      response.setHeader('Content-Type', 'application/pdf')
      response.setHeader('Content-Disposition', 'inline; filename="portfolio.pdf"')
      response.setHeader('Cache-Control', 'private, max-age=3600')

      // Pipe the PDF content to the response
      pdfResponse.pipe(response)
    })

    req.on('error', (error) => {
      console.error('Error fetching PDF:', error)
      response.status(500).json({ error: 'Failed to fetch PDF' })
    })

    req.end()

  } catch (error) {
    console.error('Error serving portfolio PDF:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// Get secure portfolio URL (requires permission)
dashboardsRouter.get('/:studentId/portfolios/:portfolioId/url', userExtractor, async (request, response) => {
  try {
    const { studentId, portfolioId } = request.params

    // Check permissions
    const student = await Student.findById(studentId)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const isOwner = student.userId.toString() === request.user._id.toString()
    const isAdmin = request.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return response.status(403).json({ error: 'Access denied' })
    }

    const dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    const portfolio = dashboard.portfolios.id(portfolioId)
    if (!portfolio) {
      return response.status(404).json({ error: 'Portfolio not found' })
    }

    if (!portfolio.pdfUrl) {
      return response.status(404).json({ error: 'Portfolio file not found' })
    }

    // Check if this is an old local file URL or a Cloudinary URL
    if (portfolio.pdfUrl.startsWith('/uploads/') || !portfolio.pdfUrl.includes('cloudinary.com')) {
      return response.status(400).json({
        error: 'This portfolio uses legacy storage and needs to be re-uploaded for secure access'
      })
    }

    const publicId = getPublicIdFromUrl(portfolio.pdfUrl)

    if (!publicId) {
      console.error('Failed to extract publicId from portfolio URL:', portfolio.pdfUrl)
      return response.status(400).json({ error: 'Invalid portfolio URL format' })
    }

    const signedUrl = getSignedPDFViewUrl(publicId, { expiresIn: 3600 })

    if (!signedUrl) {
      return response.status(500).json({ error: 'Failed to generate secure URL' })
    }

    response.json({ url: signedUrl })
  } catch (error) {
    console.error('Error getting secure portfolio URL:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// Get secure document URL (requires permission)
dashboardsRouter.get('/:studentId/documents/:documentId/url', userExtractor, async (request, response) => {
  try {
    const { studentId, documentId } = request.params

    // Check permissions
    const student = await Student.findById(studentId)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const isOwner = student.userId.toString() === request.user._id.toString()
    const isAdmin = request.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return response.status(403).json({ error: 'Access denied' })
    }

    const dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    const document = dashboard.documents.id(documentId)
    if (!document) {
      return response.status(404).json({ error: 'Document not found' })
    }

    if (!document.url) {
      return response.status(404).json({ error: 'Document file not found' })
    }

    // Check if this is an old local file URL or a Cloudinary URL
    if (document.url.startsWith('/uploads/') || !document.url.includes('cloudinary.com')) {
      return response.status(400).json({
        error: 'This document uses legacy storage and needs to be re-uploaded for secure access'
      })
    }

    const publicId = getPublicIdFromUrl(document.url)
    if (!publicId) {
      return response.status(400).json({ error: 'Invalid document URL format' })
    }

    const signedUrl = getSignedDocumentUrlWithType(publicId, document.fileName, { expiresIn: 3600 })

    if (!signedUrl) {
      return response.status(500).json({ error: 'Failed to generate secure URL' })
    }

    response.json({ url: signedUrl })
  } catch (error) {
    console.error('Error getting secure document URL:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

// Get secure invoice URL (requires permission)
dashboardsRouter.get('/:studentId/history/:historyId/receipt/url', userExtractor, async (request, response) => {
  try {
    const { studentId, historyId } = request.params

    // Check permissions
    const student = await Student.findById(studentId)
    if (!student) {
      return response.status(404).json({ error: 'Student not found' })
    }

    const isOwner = student.userId.toString() === request.user._id.toString()
    const isAdmin = request.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return response.status(403).json({ error: 'Access denied' })
    }

    const dashboard = await Dashboard.findOne({ studentId })
    if (!dashboard) {
      return response.status(404).json({ error: 'Dashboard not found' })
    }

    const historyEvent = dashboard.history.id(historyId)
    if (!historyEvent) {
      return response.status(404).json({ error: 'History event not found' })
    }

    if (!historyEvent.downloadUrl) {
      return response.status(404).json({ error: 'Invoice file not found' })
    }

    // Check if this is an old local file URL or a Cloudinary URL
    if (historyEvent.downloadUrl.startsWith('/uploads/') || !historyEvent.downloadUrl.includes('cloudinary.com')) {
      return response.status(400).json({
        error: 'This invoice uses legacy storage and needs to be re-uploaded for secure access'
      })
    }

    const publicId = getPublicIdFromUrl(historyEvent.downloadUrl)
    if (!publicId) {
      return response.status(400).json({ error: 'Invalid invoice URL format' })
    }

    const signedUrl = getSignedDocumentUrl(publicId, { expiresIn: 3600 })

    if (!signedUrl) {
      return response.status(500).json({ error: 'Failed to generate secure URL' })
    }

    response.json({ url: signedUrl })
  } catch (error) {
    console.error('Error getting secure invoice URL:', error)
    response.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = dashboardsRouter