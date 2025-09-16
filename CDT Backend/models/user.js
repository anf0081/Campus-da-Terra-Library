const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3
  },
  name: String,
  passwordHash: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      },
      message: 'Please enter a valid email address'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'tutor'],
    default: 'user'
  },
  books: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    }
  ],
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }
  ],

  // Parent/Guardian Information (optional to not break existing users)
  parentFirstName: String,
  parentMiddleName: String,
  parentLastName: String,
  parentStreetAddress: String,
  parentCity: String,
  parentPostalCode: String,
  parentCountry: String,
  parentNationality: String,
  parentPassportNumber: String,
  parentPassportExpiryDate: Date,
  parentNifNumber: String,
  contactNumber: String,

  // Emergency Contact
  emergencyContactRelationship: String,
  emergencyContactName: String,
  emergencyContactNumber: String,
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

module.exports = mongoose.model('User', userSchema)
