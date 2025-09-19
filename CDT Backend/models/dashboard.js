const mongoose = require('mongoose')

const dashboardSchema = mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },

  portfolios: [{
    pdfUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

  documents: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    fileName: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

  history: [{
    type: {
      type: String,
      enum: ['enrollment_start', 'receipt', 'enrollment_end'],
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    month: String, // for receipts (e.g., "January")
    year: Number, // for receipts (e.g., 2024)
    paymentStatus: {
      type: String,
      enum: ['paid', 'not_paid'],
      default: 'not_paid'
    },
    downloadUrl: String, // for receipt downloads
    description: String // custom description for the event
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

dashboardSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

dashboardSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    if (returnedObject._id) {
      returnedObject.id = returnedObject._id.toString()
    }
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Dashboard', dashboardSchema)