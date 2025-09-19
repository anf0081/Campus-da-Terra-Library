const { v2: cloudinary } = require('cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

// Configure Cloudinary - uses CLOUDINARY_URL environment variable
// Format: CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
cloudinary.config()

// Configure Cloudinary storage for profile pictures
const profilePictureStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cdt-student-profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    public_id: (req, file) => `student-${req.params.id}-${Date.now()}`
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

  // Extract public_id from Cloudinary URL
  // URL format: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id].[format]
  const urlParts = url.split('/')
  const uploadIndex = urlParts.indexOf('upload')

  if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
    // Get the part after version number, remove file extension
    const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/')
    return publicIdWithExtension.split('.')[0]
  }

  return null
}

module.exports = {
  cloudinary,
  uploadProfilePicture,
  deleteImage,
  getPublicIdFromUrl
}