const { v2: cloudinary } = require('cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')
const crypto = require('crypto')

// Configure Cloudinary - uses CLOUDINARY_URL environment variable
// Format: CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
cloudinary.config()

// Helper function to generate secure, non-revealing filenames
const generateSecureFilename = (prefix) => {
  const randomId = crypto.randomBytes(8).toString('hex')
  const timestamp = Date.now()
  return `${prefix}-${randomId}-${timestamp}`
}

// Configure Cloudinary storage for profile pictures
const profilePictureStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cdt-student-profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    type: 'private', // Makes images private - requires authentication to view
    transformation: [
      { width: 400, height: 400, crop: 'fill', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    public_id: (req, file) => generateSecureFilename('profile')
  }
})

// Configure Cloudinary storage for portfolios (PDFs)
const portfolioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cdt-portfolios',
    allowed_formats: ['pdf'],
    type: 'private',
    resource_type: 'raw', // For non-image files like PDFs
    public_id: (req, file) => generateSecureFilename('portfolio')
  }
})

// Configure Cloudinary storage for documents
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cdt-documents',
    // Don't restrict formats at Cloudinary level, let multer handle validation
    type: 'private',
    resource_type: (req, file) => {
      // Use 'raw' for documents, 'image' for images
      return file.mimetype.startsWith('image/') ? 'image' : 'raw'
    },
    public_id: (req, file) => generateSecureFilename('document')
  }
})

// Configure Cloudinary storage for invoice/receipt files
const invoiceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cdt-invoices',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
    type: 'private',
    resource_type: (req, file) => {
      return file.mimetype.startsWith('image/') ? 'image' : 'raw'
    },
    public_id: (req, file) => generateSecureFilename('receipt')
  }
})

// Create multer upload middleware for profile pictures
const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
})

// Create multer upload middleware for portfolios
const uploadPortfolio = multer({
  storage: portfolioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed for portfolios'), false)
    }
  }
})

// Create multer upload middleware for documents
const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(pdf|doc|docx|jpg|jpeg|png)$/i
    const extname = allowedExtensions.test(file.originalname)

    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ]
    const mimetype = allowedMimeTypes.includes(file.mimetype)

    if (mimetype && extname) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed'), false)
    }
  }
})

// Create multer upload middleware for invoices
const uploadInvoice = multer({
  storage: invoiceStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, JPG, JPEG, PNG files are allowed for invoices'), false)
    }
  }
})

// Function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error)
    throw error
  }
}

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null

  try {
    // Extract public_id from Cloudinary URL
    const urlParts = url.split('/')

    // Find either 'upload', 'image', or 'raw' in the URL parts
    let uploadIndex = urlParts.indexOf('upload')
    if (uploadIndex === -1) {
      uploadIndex = urlParts.indexOf('image')
    }
    if (uploadIndex === -1) {
      uploadIndex = urlParts.indexOf('raw')
    }

    if (uploadIndex === -1) {
      return null
    }

    // For private images: .../upload/private/s--signature--/v1234567890/folder/publicId.ext
    // For signed images: .../image/private/s--signature--/v1234567890/folder/publicId.ext
    let startIndex = uploadIndex + 1

    // Skip 'private' if present
    if (urlParts[startIndex] === 'private') {
      startIndex++
    }

    // Skip signature (starts with 's--' and ends with '--')
    if (urlParts[startIndex] && urlParts[startIndex].startsWith('s--') && urlParts[startIndex].endsWith('--')) {
      startIndex++
    }

    // Skip version number (starts with 'v' followed by digits)
    if (urlParts[startIndex] && urlParts[startIndex].match(/^v\d+$/)) {
      startIndex++
    }

    // Get remaining parts as publicId (folder/filename without extension)
    const publicIdParts = urlParts.slice(startIndex)

    if (publicIdParts.length === 0) {
      return null
    }

    // Remove file extension from the last part
    const lastPart = publicIdParts[publicIdParts.length - 1]
    publicIdParts[publicIdParts.length - 1] = lastPart.split('.')[0]

    return publicIdParts.join('/')
  } catch (error) {
    console.error('Error parsing Cloudinary URL:', url, error)
    return null
  }
}

// Generate signed URL for private files (expires in 1 hour)
const getSignedUrl = (publicId, options = {}) => {
  if (!publicId) {
    console.error('getSignedUrl: No publicId provided')
    return null
  }

  try {
    // Check if Cloudinary is configured
    if (!cloudinary.config().cloud_name) {
      console.error('getSignedUrl: Cloudinary not properly configured')
      return null
    }

    const baseConfig = {
      type: 'private',
      sign_url: true,
      secure: true, // Force HTTPS URLs
      expires_at: Math.round(Date.now() / 1000) + (options.expiresIn || 3600), // Default 1 hour
      ...options
    }

    // Add transformations only for images
    if (options.resource_type !== 'raw') {
      baseConfig.transformation = [
        { width: 400, height: 400, crop: 'fill', quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    }

    const url = cloudinary.url(publicId, baseConfig)

    return url
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
}

// Generate signed URL for documents (PDFs, etc.)
const getSignedDocumentUrl = (publicId, options = {}) => {
  return getSignedUrl(publicId, {
    resource_type: 'raw',
    ...options
  })
}

// Generate signed URL for documents with automatic resource type detection
const getSignedDocumentUrlWithType = (publicId, fileName, options = {}) => {
  // Determine resource type based on file extension
  const isImage = fileName && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)

  return getSignedUrl(publicId, {
    resource_type: isImage ? 'image' : 'raw',
    ...options
  })
}

// Generate signed URL for inline PDF viewing
const getSignedPDFViewUrl = (publicId, options = {}) => {
  return getSignedUrl(publicId, {
    resource_type: 'raw',
    disposition: 'inline', // Forces inline viewing instead of download
    ...options
  })
}

// Generate signed URL directly from stored URL
const getSignedUrlFromStoredUrl = (storedUrl, options = {}) => {
  if (!storedUrl) {
    return null
  }

  const publicId = getPublicIdFromUrl(storedUrl)
  if (!publicId) {
    return null
  }

  return getSignedUrl(publicId, options)
}

module.exports = {
  cloudinary,
  uploadProfilePicture,
  uploadPortfolio,
  uploadDocument,
  uploadInvoice,
  deleteImage,
  getPublicIdFromUrl,
  getSignedUrl,
  getSignedDocumentUrl,
  getSignedDocumentUrlWithType,
  getSignedPDFViewUrl,
  getSignedUrlFromStoredUrl
}