import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import studentService from '../services/students'
import userService from '../services/users'
import StudentCard from './StudentCard'

const Students = ({ user, setMessage, setClassName, onTokenExpired }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')

  // Form state for all student fields
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Other',
    dateOfBirth: '',

    // Address Information
    streetAddress: '',
    city: '',
    postalCode: '',
    country: '',
    nationality: '',
    passportNumber: '',
    passportExpiryDate: '',
    nifNumber: '',

    // Academic Background
    primarySchoolStage: 'Other',
    enrollmentLength: '1 year (Residents)',
    weekdayAttendance: '5 days/week',
    enrollmentStartDate: '',
    siblings: false,
    currentSchoolInPortugal: false,
    firstLanguage: '',
    englishProficiency: 'No prior knowledge',
    englishReadingWriting: 'No prior knowledge',
    portugueseLevel: 'No prior knowledge',
    skillsHobbies: '',
    strugglingSubjects: '',

    // Educational Approach & Curriculum
    approach: 'Other',
    curriculum: 'Other',
    curriculumSupplier: '',
    curriculumNotes: '',

    // Health & Special Needs
    behavioralChallenges: false,
    learningDifferences: false,
    physicalLimitations: false,
    healthConditions: false,
    dailyMedication: false,
    medicalTreatments: false,
    allergies: false,
    specialNeedsDetails: '',
    lifeThreatening: false,
    medicalDetails: '',

    // Pricing & Payment
    pricing: 'Residents',
    discount: 'None',
    paymentMethod: 'Bank Transfer',
    billingAddressSameAsHome: true,
    billingStreetAddress: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: '',
    additionalNotes: '',
    signedTuitionAgreement: false,

    // Administrative
    referralSource: '',
    motivationForJoining: [],
    photoConsent: false,
    contactListConsent: false,
    termsAndConditions: false,
    personalDataConsent: false
  })

  const handleTokenExpiration = useCallback((error) => {
    if (error.response?.status === 401 &&
        (error.response?.data?.error === 'token expired' ||
         error.response?.data?.error === 'token invalid')) {
      onTokenExpired()
      return true
    }
    return false
  }, [onTokenExpired])

  const fetchStudents = useCallback( async () => {
    try {
      setLoading(true)
      const studentList = await studentService.getAll()
      setStudents(studentList)
    } catch (error) {
      if (handleTokenExpiration(error)) return
      setMessage('Error fetching students')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setLoading(false)
    }
  }, [handleTokenExpiration, setMessage, setClassName])

  const fetchUsers = useCallback(async () => {
    if (user?.role !== 'admin') return

    try {
      const userList = await userService.getAll()
      setUsers(userList)
    } catch (error) {
      if (handleTokenExpiration(error)) return
      console.error('Error fetching users:', error)
    }
  }, [user?.role, handleTokenExpiration])

  useEffect(() => {
    if (user?.token) {
      studentService.setToken(user.token)
      userService.setToken(user.token)
      fetchStudents()
      fetchUsers()
    }
  }, [user, fetchStudents, fetchUsers])

  // Handle navigation state (when coming from Users page)
  useEffect(() => {
    if (location.state?.selectedStudent && students.length > 0) {
      const student = location.state.selectedStudent
      const mode = location.state.mode

      setSelectedStudent(student)
      if (mode === 'edit') {
        setIsEditing(true)
        populateForm(student)
      } else {
        setIsEditing(false)
      }
      setIsCreating(false)

      // Clear the navigation state to prevent re-triggering
      window.history.replaceState({}, document.title)
    }
  }, [location.state, students])

  const resetForm = () => {
    setSelectedUserId('')
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      gender: 'Other',
      dateOfBirth: '',
      streetAddress: '',
      city: '',
      postalCode: '',
      country: '',
      nationality: '',
      passportNumber: '',
      passportExpiryDate: '',
      nifNumber: '',
      primarySchoolStage: 'Other',
      enrollmentLength: '1 year (Residents)',
      weekdayAttendance: '5 days/week',
      enrollmentStartDate: '',
      siblings: false,
      currentSchoolInPortugal: false,
      firstLanguage: '',
      englishProficiency: 'No prior knowledge',
      englishReadingWriting: 'No prior knowledge',
      portugueseLevel: 'No prior knowledge',
      skillsHobbies: '',
      strugglingSubjects: '',
      approach: 'Other',
      curriculum: 'Other',
      curriculumSupplier: '',
      curriculumNotes: '',
      behavioralChallenges: false,
      learningDifferences: false,
      physicalLimitations: false,
      healthConditions: false,
      dailyMedication: false,
      medicalTreatments: false,
      allergies: false,
      specialNeedsDetails: '',
      lifeThreatening: false,
      medicalDetails: '',
      pricing: 'Residents',
      discount: 'None',
      paymentMethod: 'Bank Transfer',
      billingAddressSameAsHome: true,
      billingStreetAddress: '',
      billingCity: '',
      billingPostalCode: '',
      billingCountry: '',
      additionalNotes: '',
      signedTuitionAgreement: false,
      referralSource: '',
      motivationForJoining: [],
      photoConsent: false,
      contactListConsent: false,
      termsAndConditions: false,
      personalDataConsent: false
    })
  }

  const populateForm = (student) => {
    setFormData({
      firstName: student.firstName || '',
      middleName: student.middleName || '',
      lastName: student.lastName || '',
      gender: student.gender || '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      streetAddress: student.streetAddress || '',
      city: student.city || '',
      postalCode: student.postalCode || '',
      country: student.country || '',
      nationality: student.nationality || '',
      passportNumber: student.passportNumber || '',
      passportExpiryDate: student.passportExpiryDate ? student.passportExpiryDate.split('T')[0] : '',
      nifNumber: student.nifNumber || '',
      primarySchoolStage: student.primarySchoolStage || '',
      enrollmentLength: student.enrollmentLength || '',
      weekdayAttendance: student.weekdayAttendance || '',
      enrollmentStartDate: student.enrollmentStartDate ? student.enrollmentStartDate.split('T')[0] : '',
      siblings: student.siblings || false,
      currentSchoolInPortugal: student.currentSchoolInPortugal || false,
      firstLanguage: student.firstLanguage || '',
      englishProficiency: student.englishProficiency || '',
      englishReadingWriting: student.englishReadingWriting || '',
      portugueseLevel: student.portugueseLevel || '',
      skillsHobbies: student.skillsHobbies || '',
      strugglingSubjects: student.strugglingSubjects || '',
      approach: student.approach || '',
      curriculum: student.curriculum || '',
      curriculumSupplier: student.curriculumSupplier || '',
      curriculumNotes: student.curriculumNotes || '',
      behavioralChallenges: student.behavioralChallenges || false,
      learningDifferences: student.learningDifferences || false,
      physicalLimitations: student.physicalLimitations || false,
      healthConditions: student.healthConditions || false,
      dailyMedication: student.dailyMedication || false,
      medicalTreatments: student.medicalTreatments || false,
      allergies: student.allergies || false,
      specialNeedsDetails: student.specialNeedsDetails || '',
      lifeThreatening: student.lifeThreatening || false,
      medicalDetails: student.medicalDetails || '',
      pricing: student.pricing || 'Residents',
      discount: student.discount || 'None',
      paymentMethod: student.paymentMethod || 'Bank Transfer',
      billingAddressSameAsHome: student.billingAddressSameAsHome !== undefined ? student.billingAddressSameAsHome : true,
      billingStreetAddress: student.billingStreetAddress || '',
      billingCity: student.billingCity || '',
      billingPostalCode: student.billingPostalCode || '',
      billingCountry: student.billingCountry || '',
      additionalNotes: student.additionalNotes || '',
      signedTuitionAgreement: student.signedTuitionAgreement || false,
      referralSource: student.referralSource || '',
      motivationForJoining: student.motivationForJoining || [],
      photoConsent: student.photoConsent || false,
      contactListConsent: student.contactListConsent || false,
      termsAndConditions: student.termsAndConditions || false,
      personalDataConsent: student.personalDataConsent || false
    })
  }

  const handleCreateStart = () => {
    resetForm()
    setIsCreating(true)
    setSelectedStudent(null)
    setIsEditing(false)
  }

  const handleEditStart = (student) => {
    populateForm(student)
    setSelectedStudent(student)
    setIsEditing(true)
    setIsCreating(false)
  }

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    setIsEditing(false)
    setIsCreating(false)
  }

  const handleViewDashboard = (studentId) => {
    navigate(`/dashboard/${studentId}`)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCheckboxChange = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    try {
      // Validation for admin users creating students
      if (isCreating && user?.role === 'admin' && !selectedUserId) {
        setMessage('Please select a user to assign this student to')
        setClassName('error')
        setTimeout(() => setMessage(null), 5000)
        return
      }

      if (isCreating) {
        // For admin users, include the selected userId, otherwise let backend use current user
        const studentData = user?.role === 'admin' && selectedUserId
          ? { ...formData, userId: selectedUserId }
          : formData

        const newStudent = await studentService.create(studentData)
        setStudents(prev => [...prev, newStudent])
        setMessage('Student created successfully')
        setClassName('success')
      } else if (isEditing && selectedStudent) {
        const updatedStudent = await studentService.update(selectedStudent.id, formData)
        setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s))
        setSelectedStudent(updatedStudent)
        setMessage('Student updated successfully')
        setClassName('success')
      }

      setIsEditing(false)
      setIsCreating(false)
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch (error) {
      if (handleTokenExpiration(error)) return
      const backendMsg = error.response?.data?.error
      setMessage(backendMsg || 'Error saving student')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  // Delete confirmation function that requires typing "DELETE"
  const confirmDelete = (itemType, itemName) => {
    const userInput = prompt(
      `To confirm deletion of this ${itemType}, please type "DELETE" below:\n\n${itemName}\n\nType "DELETE" to confirm:`
    )
    return userInput === "DELETE"
  }

  const handleDelete = async (studentId) => {
    const studentToDelete = students.find(s => (s.id || s._id) === studentId)
    if (!studentToDelete) {
      setMessage('Student not found')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
      return
    }

    const confirmed = confirmDelete("student", `${studentToDelete.firstName} ${studentToDelete.lastName}`)
    if (!confirmed) return

    try {
      await studentService.remove(studentId)
      setStudents(prev => prev.filter(s => s.id !== studentId))
      setSelectedStudent(null)
      setMessage('Student deleted successfully')
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch (error) {
      if (handleTokenExpiration(error)) return
      const backendMsg = error.response?.data?.error
      setMessage(backendMsg || 'Error deleting student')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsCreating(false)
    setSelectedStudent(null)
  }

  if (loading) {
    return <div>Loading students...</div>
  }

  // Student List View
  if (!selectedStudent && !isCreating) {
    return (
      <div>
        <h2>Students</h2>
        <div className="students-container">
          <div className="students-actions">
            <button onClick={handleCreateStart}>Add New Student</button>
          </div>

          {students.length === 0 ? (
            <p>No students found. Add your first student!</p>
          ) : (
            <div className="students-list">
              {students.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onView={handleViewStudent}
                  onEdit={handleEditStart}
                  onDelete={handleDelete}
                  onDashboard={handleViewDashboard}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Student Detail/Form View
  return (
    <div>
      <h2>
        {isCreating ? 'Add New Student' :
         isEditing ? `Edit ${selectedStudent?.firstName} ${selectedStudent?.lastName}` :
         `${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
      </h2>

      <div className="student-detail-container">
        <div className="student-actions">
          <button onClick={() => setSelectedStudent(null)}>← Back to Student List</button>
          {!isEditing && !isCreating && (
            <button onClick={() => handleEditStart(selectedStudent)}>Edit Student</button>
          )}
        </div>

        {(isEditing || isCreating) ? (
          <form onSubmit={handleSave} className="student-form">
            <div className="form-sections">
              {/* User Selection (Admin Only) */}
              {user?.role === 'admin' && isCreating && (
                <div className="form-section">
                  <h3>Assign to User</h3>
                  <div className="form-group">
                    <label>Select User *</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                    >
                      <option value="">Choose a user...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.username} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="form-section">
                <h3>Address Information</h3>
                <div className="form-group">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    value={formData.streetAddress}
                    onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code *</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nationality *</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Passport Number *</label>
                  <input
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Passport Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.passportExpiryDate}
                    onChange={(e) => handleInputChange('passportExpiryDate', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>NIF Number</label>
                  <input
                    type="text"
                    value={formData.nifNumber}
                    onChange={(e) => handleInputChange('nifNumber', e.target.value)}
                  />
                </div>
              </div>

              {/* Academic Background */}
              <div className="form-section">
                <h3>Academic Background</h3>
                <div className="form-group">
                  <label>Primary School Stage</label>
                  <select
                    value={formData.primarySchoolStage}
                    onChange={(e) => handleInputChange('primarySchoolStage', e.target.value)}
                  >
                    <option value="">Select Stage</option>
                    <option value="Learn to Read and Write">Learn to Read and Write</option>
                    <option value="Ages 6-7">Ages 6-7</option>
                    <option value="Ages 7-8">Ages 7-8</option>
                    <option value="Ages 8-9">Ages 8-9</option>
                    <option value="Ages 9-10">Ages 9-10</option>
                    <option value="Ages 10-11">Ages 10-11</option>
                    <option value="Ages 11-12">Ages 11-12</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Enrollment Length</label>
                  <select
                    value={formData.enrollmentLength}
                    onChange={(e) => handleInputChange('enrollmentLength', e.target.value)}
                  >
                    <option value="">Select Length</option>
                    <option value="6 months (Residents)">6 months (Residents)</option>
                    <option value="1 year (Residents)">1 year (Residents)</option>
                    <option value="Multiple years (Residents)">Multiple years (Residents)</option>
                    <option value="1 month (Traveling family)">1 month (Traveling family)</option>
                    <option value="2 months (Traveling Family)">2 months (Traveling Family)</option>
                    <option value="3 months (Traveling Family)">3 months (Traveling Family)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Weekday Attendance</label>
                  <select
                    value={formData.weekdayAttendance}
                    onChange={(e) => handleInputChange('weekdayAttendance', e.target.value)}
                  >
                    <option value="">Select Attendance</option>
                    <option value="1 day/week">1 day/week</option>
                    <option value="2 days/week">2 days/week</option>
                    <option value="3 days/week">3 days/week</option>
                    <option value="4 days/week">4 days/week</option>
                    <option value="5 days/week">5 days/week</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Enrollment Start Date</label>
                  <input
                    type="date"
                    value={formData.enrollmentStartDate}
                    onChange={(e) => handleInputChange('enrollmentStartDate', e.target.value)}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.siblings}
                      onChange={(e) => handleCheckboxChange('siblings', e.target.checked)}
                    />
                    Has Siblings
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.currentSchoolInPortugal}
                      onChange={(e) => handleCheckboxChange('currentSchoolInPortugal', e.target.checked)}
                    />
                    Currently in School in Portugal
                  </label>
                </div>
                <div className="form-group">
                  <label>First Language</label>
                  <input
                    type="text"
                    value={formData.firstLanguage}
                    onChange={(e) => handleInputChange('firstLanguage', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>English Proficiency</label>
                  <select
                    value={formData.englishProficiency}
                    onChange={(e) => handleInputChange('englishProficiency', e.target.value)}
                  >
                    <option value="">Select Level</option>
                    <option value="No prior knowledge">No prior knowledge</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Proficient">Proficient</option>
                    <option value="Fluent">Fluent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>English Reading & Writing</label>
                  <select
                    value={formData.englishReadingWriting}
                    onChange={(e) => handleInputChange('englishReadingWriting', e.target.value)}
                  >
                    <option value="">Select Level</option>
                    <option value="No prior knowledge">No prior knowledge</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Portuguese Level</label>
                  <select
                    value={formData.portugueseLevel}
                    onChange={(e) => handleInputChange('portugueseLevel', e.target.value)}
                  >
                    <option value="">Select Level</option>
                    <option value="No prior knowledge">No prior knowledge</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Proficient">Proficient</option>
                    <option value="Fluent">Fluent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Skills & Hobbies</label>
                  <textarea
                    value={formData.skillsHobbies}
                    onChange={(e) => handleInputChange('skillsHobbies', e.target.value)}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Struggling Subjects</label>
                  <textarea
                    value={formData.strugglingSubjects}
                    onChange={(e) => handleInputChange('strugglingSubjects', e.target.value)}
                    rows="3"
                  />
                </div>
              </div>

              {/* Educational Approach & Curriculum */}
              <div className="form-section">
                <h3>Educational Approach & Curriculum</h3>
                <div className="form-group">
                  <label>Approach</label>
                  <select
                    value={formData.approach}
                    onChange={(e) => handleInputChange('approach', e.target.value)}
                  >
                    <option value="">Select Approach</option>
                    <option value="Unschooling">Unschooling</option>
                    <option value="Core Education">Core Education</option>
                    <option value="Qualifications for higher education">Qualifications for higher education</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Curriculum</label>
                  <select
                    value={formData.curriculum}
                    onChange={(e) => handleInputChange('curriculum', e.target.value)}
                  >
                    <option value="">Select Curriculum</option>
                    <option value="Online School">Online School</option>
                    <option value="Workbook Curriculum">Workbook Curriculum</option>
                    <option value="Mix and Match">Mix and Match</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Curriculum Supplier</label>
                  <input
                    type="text"
                    value={formData.curriculumSupplier}
                    onChange={(e) => handleInputChange('curriculumSupplier', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Curriculum Notes</label>
                  <textarea
                    value={formData.curriculumNotes}
                    onChange={(e) => handleInputChange('curriculumNotes', e.target.value)}
                    rows="3"
                  />
                </div>
              </div>

              {/* Health & Special Needs */}
              <div className="form-section">
                <h3>Health & Special Needs</h3>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.behavioralChallenges}
                      onChange={(e) => handleCheckboxChange('behavioralChallenges', e.target.checked)}
                    />
                    Behavioral Challenges
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.learningDifferences}
                      onChange={(e) => handleCheckboxChange('learningDifferences', e.target.checked)}
                    />
                    Learning Differences
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.physicalLimitations}
                      onChange={(e) => handleCheckboxChange('physicalLimitations', e.target.checked)}
                    />
                    Physical Limitations
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.healthConditions}
                      onChange={(e) => handleCheckboxChange('healthConditions', e.target.checked)}
                    />
                    Health Conditions
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.dailyMedication}
                      onChange={(e) => handleCheckboxChange('dailyMedication', e.target.checked)}
                    />
                    Daily Medication
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.medicalTreatments}
                      onChange={(e) => handleCheckboxChange('medicalTreatments', e.target.checked)}
                    />
                    Medical Treatments
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.allergies}
                      onChange={(e) => handleCheckboxChange('allergies', e.target.checked)}
                    />
                    Allergies
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.lifeThreatening}
                      onChange={(e) => handleCheckboxChange('lifeThreatening', e.target.checked)}
                    />
                    Life Threatening Conditions
                  </label>
                </div>
                <div className="form-group">
                  <label>Special Needs Details</label>
                  <textarea
                    value={formData.specialNeedsDetails}
                    onChange={(e) => handleInputChange('specialNeedsDetails', e.target.value)}
                    rows="3"
                    placeholder="Please elaborate on any special needs..."
                  />
                </div>
                <div className="form-group">
                  <label>Medical Details</label>
                  <textarea
                    value={formData.medicalDetails}
                    onChange={(e) => handleInputChange('medicalDetails', e.target.value)}
                    rows="3"
                    placeholder="Please elaborate on any medical conditions..."
                  />
                </div>
              </div>

              {/* Pricing & Payment - Admin Only */}
              {user?.role === 'admin' && (
                <div className="form-section">
                  <h3>Pricing & Payment</h3>
                  <div className="form-group">
                    <label>Pricing Category</label>
                    <select
                      value={formData.pricing}
                      onChange={(e) => handleInputChange('pricing', e.target.value)}
                    >
                      <option value="Residents">Residents</option>
                      <option value="Financial Hardship">Financial Hardship</option>
                      <option value="Traveling Families">Traveling Families</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Discount</label>
                    <select
                      value={formData.discount}
                      onChange={(e) => handleInputChange('discount', e.target.value)}
                    >
                      <option value="None">None</option>
                      <option value="Sibling Discount">Sibling Discount</option>
                      <option value="Early Payment Discount">Early Payment Discount</option>
                      <option value="Referral Discount">Referral Discount</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="SEPA direct debit">SEPA direct debit</option>
                      <option value="MBWay">MBWay</option>
                      <option value="Stripe">Stripe</option>
                      <option value="Bitcoin">Bitcoin</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.billingAddressSameAsHome}
                        onChange={(e) => handleCheckboxChange('billingAddressSameAsHome', e.target.checked)}
                      />
                      Billing Address Same as Home
                    </label>
                  </div>
                  {!formData.billingAddressSameAsHome && (
                    <>
                      <div className="form-group">
                        <label>Billing Street Address</label>
                        <input
                          type="text"
                          value={formData.billingStreetAddress}
                          onChange={(e) => handleInputChange('billingStreetAddress', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Billing City</label>
                        <input
                          type="text"
                          value={formData.billingCity}
                          onChange={(e) => handleInputChange('billingCity', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Billing Postal Code</label>
                        <input
                          type="text"
                          value={formData.billingPostalCode}
                          onChange={(e) => handleInputChange('billingPostalCode', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Billing Country</label>
                        <input
                          type="text"
                          value={formData.billingCountry}
                          onChange={(e) => handleInputChange('billingCountry', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      value={formData.additionalNotes}
                      onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                      rows="3"
                    />
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.signedTuitionAgreement}
                        onChange={(e) => handleCheckboxChange('signedTuitionAgreement', e.target.checked)}
                      />
                      Signed Tuition Agreement
                    </label>
                  </div>
                </div>
              )}

              {/* Administrative */}
              <div className="form-section">
                <h3>Administrative</h3>
                <div className="form-group">
                  <label>Referral Source</label>
                  <input
                    type="text"
                    value={formData.referralSource}
                    onChange={(e) => handleInputChange('referralSource', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Motivation for Joining</label>
                  <div className="checkbox-list">
                    {[
                      'Alternative / more holistic education',
                      'Democratic / self-directed learning approach',
                      'To be part of a community',
                      'Quality of teachers',
                      'The values and culture of the school',
                      'The campus and natural environment',
                      'A sense of adventure / Madeira',
                      'Traveling family looking for short-term enrollments',
                      'Other'
                    ].map((option) => (
                      <div key={option} className="form-group checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={formData.motivationForJoining.includes(option)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  motivationForJoining: [...prev.motivationForJoining, option]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  motivationForJoining: prev.motivationForJoining.filter(item => item !== option)
                                }))
                              }
                            }}
                          />
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.photoConsent}
                      onChange={(e) => handleCheckboxChange('photoConsent', e.target.checked)}
                    />
                    Photo Consent
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.contactListConsent}
                      onChange={(e) => handleCheckboxChange('contactListConsent', e.target.checked)}
                    />
                    Contact List Consent
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.termsAndConditions}
                      onChange={(e) => handleCheckboxChange('termsAndConditions', e.target.checked)}
                    />
                    Terms and Conditions Accepted
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.personalDataConsent}
                      onChange={(e) => handleCheckboxChange('personalDataConsent', e.target.checked)}
                    />
                    Personal Data Consent
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit">Save Student</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        ) : (
          // Student Detail View
          <div className="student-detail">
            <div className="detail-sections">
              <div className="detail-section">
                <h3>Personal Information</h3>
                <p><strong>Full Name:</strong> {selectedStudent?.firstName} {selectedStudent?.middleName} {selectedStudent?.lastName}</p>
                <p><strong>Gender:</strong> {selectedStudent?.gender || 'Not set'}</p>
                <p><strong>Date of Birth:</strong> {selectedStudent?.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'Not set'}</p>
                <p><strong>Age:</strong> {selectedStudent?.dateOfBirth ? Math.floor((new Date() - new Date(selectedStudent.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h3>Address Information</h3>
                <p><strong>Street Address:</strong> {selectedStudent?.streetAddress || 'Not set'}</p>
                <p><strong>City:</strong> {selectedStudent?.city || 'Not set'}</p>
                <p><strong>Postal Code:</strong> {selectedStudent?.postalCode || 'Not set'}</p>
                <p><strong>Country:</strong> {selectedStudent?.country || 'Not set'}</p>
                <p><strong>Nationality:</strong> {selectedStudent?.nationality || 'Not set'}</p>
                <p><strong>Passport Number:</strong> {selectedStudent?.passportNumber || 'Not set'}</p>
                <p><strong>Passport Expiry:</strong> {selectedStudent?.passportExpiryDate ? new Date(selectedStudent.passportExpiryDate).toLocaleDateString() : 'Not set'}</p>
                <p><strong>NIF Number:</strong> {selectedStudent?.nifNumber || 'Not set'}</p>
              </div>

              <div className="detail-section">
                <h3>Academic Information</h3>
                <p><strong>Primary School Stage:</strong> {selectedStudent?.primarySchoolStage || 'Not set'}</p>
                <p><strong>Enrollment Length:</strong> {selectedStudent?.enrollmentLength || 'Not set'}</p>
                <p><strong>Weekday Attendance:</strong> {selectedStudent?.weekdayAttendance || 'Not set'}</p>
                <p><strong>Enrollment Start Date:</strong> {selectedStudent?.enrollmentStartDate ? new Date(selectedStudent.enrollmentStartDate).toLocaleDateString() : 'Not set'}</p>
                <p><strong>Has Siblings:</strong> {selectedStudent?.siblings ? 'Yes' : 'No'}</p>
                <p><strong>Currently in Portugal School:</strong> {selectedStudent?.currentSchoolInPortugal ? 'Yes' : 'No'}</p>
                <p><strong>First Language:</strong> {selectedStudent?.firstLanguage || 'Not set'}</p>
                <p><strong>English Proficiency:</strong> {selectedStudent?.englishProficiency || 'Not set'}</p>
                <p><strong>English Reading & Writing:</strong> {selectedStudent?.englishReadingWriting || 'Not set'}</p>
                <p><strong>Portuguese Level:</strong> {selectedStudent?.portugueseLevel || 'Not set'}</p>
                <p><strong>Skills & Hobbies:</strong> {selectedStudent?.skillsHobbies || 'Not set'}</p>
                <p><strong>Struggling Subjects:</strong> {selectedStudent?.strugglingSubjects || 'Not set'}</p>
              </div>

              <div className="detail-section">
                <h3>Educational Approach & Curriculum</h3>
                <p><strong>Approach:</strong> {selectedStudent?.approach || 'Not set'}</p>
                <p><strong>Curriculum:</strong> {selectedStudent?.curriculum || 'Not set'}</p>
                <p><strong>Curriculum Supplier:</strong> {selectedStudent?.curriculumSupplier || 'Not set'}</p>
                <p><strong>Curriculum Notes:</strong> {selectedStudent?.curriculumNotes || 'Not set'}</p>
              </div>

              <div className="detail-section">
                <h3>Health & Special Needs</h3>
                <p><strong>Behavioral Challenges:</strong> {selectedStudent?.behavioralChallenges ? 'Yes' : 'No'}</p>
                <p><strong>Learning Differences:</strong> {selectedStudent?.learningDifferences ? 'Yes' : 'No'}</p>
                <p><strong>Physical Limitations:</strong> {selectedStudent?.physicalLimitations ? 'Yes' : 'No'}</p>
                <p><strong>Health Conditions:</strong> {selectedStudent?.healthConditions ? 'Yes' : 'No'}</p>
                <p><strong>Daily Medication:</strong> {selectedStudent?.dailyMedication ? 'Yes' : 'No'}</p>
                <p><strong>Medical Treatments:</strong> {selectedStudent?.medicalTreatments ? 'Yes' : 'No'}</p>
                <p><strong>Allergies:</strong> {selectedStudent?.allergies ? 'Yes' : 'No'}</p>
                <p><strong>Life Threatening Conditions:</strong> {selectedStudent?.lifeThreatening ? 'Yes' : 'No'}</p>
                <p><strong>Special Needs Details:</strong> {selectedStudent?.specialNeedsDetails || 'Not set'}</p>
                <p><strong>Medical Details:</strong> {selectedStudent?.medicalDetails || 'Not set'}</p>
              </div>

              {/* Pricing & Payment - Admin Only */}
              {user?.role === 'admin' && (
                <div className="detail-section">
                  <h3>Pricing & Payment</h3>
                  <p><strong>Pricing Category:</strong> {selectedStudent?.pricing || 'Not set'}</p>
                  <p><strong>Discount:</strong> {selectedStudent?.discount || 'Not set'}</p>
                  <p><strong>Payment Method:</strong> {selectedStudent?.paymentMethod || 'Not set'}</p>
                  <p><strong>Billing Address Same as Home:</strong> {selectedStudent?.billingAddressSameAsHome ? 'Yes' : 'No'}</p>
                  {!selectedStudent?.billingAddressSameAsHome && (
                    <>
                      <p><strong>Billing Street Address:</strong> {selectedStudent?.billingStreetAddress || 'Not set'}</p>
                      <p><strong>Billing City:</strong> {selectedStudent?.billingCity || 'Not set'}</p>
                      <p><strong>Billing Postal Code:</strong> {selectedStudent?.billingPostalCode || 'Not set'}</p>
                      <p><strong>Billing Country:</strong> {selectedStudent?.billingCountry || 'Not set'}</p>
                    </>
                  )}
                  <p><strong>Additional Notes:</strong> {selectedStudent?.additionalNotes || 'Not set'}</p>
                  <p><strong>Signed Tuition Agreement:</strong> {selectedStudent?.signedTuitionAgreement ? 'Yes' : 'No'}</p>
                </div>
              )}

              <div className="detail-section">
                <h3>Administrative</h3>
                <p><strong>Referral Source:</strong> {selectedStudent?.referralSource || 'Not set'}</p>
                <p><strong>Motivation for Joining:</strong> {selectedStudent?.motivationForJoining?.length > 0 ? selectedStudent.motivationForJoining.join(', ') : 'Not set'}</p>
                <p><strong>Photo Consent:</strong> {selectedStudent?.photoConsent ? 'Yes' : 'No'}</p>
                <p><strong>Contact List Consent:</strong> {selectedStudent?.contactListConsent ? 'Yes' : 'No'}</p>
                <p><strong>Terms and Conditions:</strong> {selectedStudent?.termsAndConditions ? 'Accepted' : 'Not accepted'}</p>
                <p><strong>Personal Data Consent:</strong> {selectedStudent?.personalDataConsent ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Students