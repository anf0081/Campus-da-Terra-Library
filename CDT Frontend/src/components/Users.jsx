import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import userService from '../services/users'
import studentService from '../services/students'
import StudentCard from './StudentCard'
import UserCard from './UserCard'

const Users = ({ user, setMessage, setClassName, onTokenExpired }) => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state for editing user
  const [formData, setFormData] = useState({
    // Login and Contact
    username: '',
    password: '',
    email: '',
    contactNumber: '',
    role: '',

    // Personal Information
    name: '',
    parentNationality: '',
    parentPassportNumber: '',
    parentPassportExpiryDate: '',
    parentNifNumber: '',

    // Address
    parentStreetAddress: '',
    parentCity: '',
    parentPostalCode: '',
    parentCountry: '',

    // Emergency Contact
    emergencyContactRelationship: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
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
  
    const fetchUsers = useCallback( async () => {
      try {
        setLoading(true)
        const userList = await userService.getAll()
        setUsers(userList)
      } catch (error) {
        if (handleTokenExpiration(error)) return
        setMessage('Error fetching users')
        setClassName('error')
        setTimeout(() => setMessage(null), 5000)
      } finally {
        setLoading(false)
      }
    }, [handleTokenExpiration, setMessage, setClassName])
  
    useEffect(() => {
      if (user?.token) {
        userService.setToken(user.token)
        fetchUsers()
      }
    }, [user, fetchUsers])

  const resetForm = () => {
    setFormData({
    username: '',
    password: '',
    email: '',
    contactNumber: '',
    role: '',
    name: '',
    parentNationality: '',
    parentPassportNumber: '',
    parentPassportExpiryDate: '',
    parentNifNumber: '',
    parentStreetAddress: '',
    parentCity: '',
    parentPostalCode: '',
    parentCountry: '',
    emergencyContactRelationship: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    })
  }

  const populateForm = (user) => {
    setFormData({
    username: user.username || '',
    password: '',
    email: user.email || '',
    contactNumber: user.contactNumber || '', 
    name: user.name || '',
    parentNationality: user.parentNationality || '',
    parentPassportNumber: user.parentPassportNumber || '',
    parentPassportExpiryDate: user.parentPassportExpiryDate ? user.parentPassportExpiryDate.split('T')[0] : '',
    parentNifNumber: user.parentNifNumber || '',
    parentStreetAddress: user.parentStreetAddress || '',
    parentCity: user.parentCity || '',
    parentPostalCode: user.parentPostalCode || '',
    parentCountry: user.parentCountry || '',
    emergencyContactRelationship: user.emergencyContactRelationship || '',
    emergencyContactName: user.emergencyContactName || '',
    emergencyContactNumber: user.emergencyContactNumber || '',
 })
  }

  const handleSave = async (event) => {
      event.preventDefault()
      try {
  
        if (isCreating) {
          const newUser = await userService.create(formData)
          setUsers(prev => [...prev, newUser])
          setMessage('User created successfully')
          setClassName('success')
        } else if (isEditing && selectedUser) {
          const updatedUser = await userService.update(selectedUser.id, formData)
          setUsers(prev => prev.map(s => s.id === selectedUser.id ? updatedUser : s))
          setSelectedUser(updatedUser)
          setMessage('User updated successfully')
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
        setMessage(backendMsg || 'Error saving user')
        setClassName('error')
        setTimeout(() => setMessage(null), 5000)
      }
    }

   const handleCancel = () => {
    setIsEditing(false)
    setIsCreating(false)
    setSelectedUser(null)
  }

  const handleCreateStart = () => {
    resetForm()
    setIsCreating(true)
    setSelectedUser(null)
    setIsEditing(false)
  }

  const handleEditStart = (user) => {
    populateForm(user)
    setSelectedUser(user)
    setIsEditing(true)
    setIsCreating(false)
  }

    const handleViewUser = (user) => {
    setSelectedUser(user)
    setIsEditing(false)
    setIsCreating(false)
  }

  // Delete confirmation function that requires typing "DELETE"
  const confirmDelete = (itemType, itemName) => {
    const userInput = prompt(
      `To confirm deletion of this ${itemType}, please type "DELETE" below:\n\n${itemName}\n\nType "DELETE" to confirm:`
    )
    return userInput === "DELETE"
  }

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => (u.id || u._id) === userId)
    if (!userToDelete) return

    const confirmed = confirmDelete("user", `${userToDelete.name || userToDelete.username} (${userToDelete.email})`)
    if (!confirmed) return

    try {
      await userService.remove(userId)
      setUsers(prev => prev.filter(u => (u.id || u._id) !== userId))
      setMessage('User deleted successfully')
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch (error) {
      if (handleTokenExpiration(error)) return
      setMessage('Error deleting user')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    }
  }

   const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Student management functions
  const handleViewStudent = (student) => {
    // Navigate to Students page with the student in view mode
    navigate('/students', {
      state: {
        selectedStudent: student,
        mode: 'view'
      }
    })
  }

  const handleEditStudent = (student) => {
    // Navigate to Students page with the student in edit mode
    navigate('/students', {
      state: {
        selectedStudent: student,
        mode: 'edit'
      }
    })
  }

  const handleDeleteStudent = async (studentId) => {
    // Find the student to get their name for confirmation
    let studentToDelete = null
    for (const u of users) {
      if (u.students) {
        studentToDelete = u.students.find(s => (s._id || s.id) === studentId)
        if (studentToDelete) break
      }
    }

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

      // Update the users list to remove the deleted student
      setUsers(users.map(u => ({
        ...u,
        students: u.students?.filter(s => s._id !== studentId) || []
      })))

      // Update selected user if it's currently displayed
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          students: selectedUser.students?.filter(s => s._id !== studentId) || []
        })
      }

      setMessage('Student deleted successfully')
      setClassName('success')
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch (error) {
      if (handleTokenExpiration(error)) return
      setMessage('Error deleting student')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div>
        <h2>Access Denied</h2>
        <p>You need admin privileges to access this page.</p>
      </div>
    )
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div>
      <h2>Users Management</h2>

      {!isCreating && !isEditing && !selectedUser ? (
        <div className="users-container">
        <div className="users-actions">
            <button onClick={handleCreateStart}>Add New User</button>
        </div>

            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <div className="users-list">
              {users.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  onView={handleViewUser}
                  onEdit={handleEditStart}
                  onDelete={handleDeleteUser}
                />
                ))}
            </div>
            )}
          </div>
      ) : isCreating ? (
        <div className="user-detail-container">
          <div className="user-actions">
            <button onClick={() => { setIsCreating(false); setSelectedUser(null); }}>
              ← Back to Users List
            </button>
          </div>

          <form onSubmit={handleSave} className="user-form">
            <h3>Create New User</h3>

            <div className="profile-grid">
              <div className="profile-section">
                <h3>Login Information</h3>
                <p className="profile-field">
                  <strong>Username:</strong>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="profile-input"
                    required
                  />
                </p>
                <p className="profile-field">
                  <strong>Password:</strong>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="profile-input"
                    required
                  />
                </p>
                <p className="profile-field">
                  <strong>Role:</strong>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="profile-input"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </p>
                <p className="profile-field">
                  <strong>Email:</strong>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="profile-input"
                    required
                  />
                </p>
                <p className="profile-field">
                  <strong>Phone:</strong>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    className="profile-input"
                  />
                </p>
              </div>

              <div className="profile-section">
                <h3>Personal Information</h3>
                <p className="profile-field">
                  <strong>Full Name:</strong>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="profile-input"
                  />
                </p>
                <p className="profile-field">
                  <strong>Nationality:</strong>
                  <input
                    type="text"
                    value={formData.parentNationality}
                    onChange={(e) => handleInputChange('parentNationality', e.target.value)}
                    className="profile-input"
                  />
                </p>
                <p className="profile-field">
                  <strong>Passport Number:</strong>
                  <input
                    type="text"
                    value={formData.parentPassportNumber}
                    onChange={(e) => handleInputChange('parentPassportNumber', e.target.value)}
                    className="profile-input"
                  />
                </p>
                <p className="profile-field">
                  <strong>Passport Expiry:</strong>
                  <input
                    type="date"
                    value={formData.parentPassportExpiryDate}
                    onChange={(e) => handleInputChange('parentPassportExpiryDate', e.target.value)}
                    className="profile-input"
                  />
                </p>
                <p className="profile-field">
                  <strong>NIF Number:</strong>
                  <input
                    type="text"
                    value={formData.parentNifNumber}
                    onChange={(e) => handleInputChange('parentNifNumber', e.target.value)}
                    className="profile-input"
                  />
                </p>
              </div>

              <div className="profile-section">
                <h3>Address</h3>
                <p className="profile-field">
                  <strong>Street Address:</strong>
                  <input
                    type="text"
                    value={formData.parentStreetAddress}
                    onChange={(e) => handleInputChange('parentStreetAddress', e.target.value)}
                    className="profile-input"
                  />
                </p>
                <p className="profile-field">
                  <strong>City:</strong>
                  <input
                    type="text"
                    value={formData.parentCity}
                    onChange={(e) => handleInputChange('parentCity', e.target.value)}
                    className="profile-input"
                  />
                </p>
                <p className="profile-field">
                  <strong>Postal Code:</strong>
                  <input
                    type="text"
                    value={formData.parentPostalCode}
                    onChange={(e) => handleInputChange('parentPostalCode', e.target.value)}
                    className="profile-input"
                  />
                </p>
                <p className="profile-field">
                  <strong>Country:</strong>
                  <input
                    type="text"
                    value={formData.parentCountry}
                    onChange={(e) => handleInputChange('parentCountry', e.target.value)}
                    className="profile-input"
                  />
                </p>
              </div>

              <div className="profile-section">
                <h3>Emergency Contact</h3>
                <p className="profile-field">
                  <strong>Relationship:</strong>
                  <input
                    type="text"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                    className="profile-input"
                  />
                </p>
                <p className="profile-field">
                  <strong>Name:</strong>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    className="profile-input"
                  />
                </p>
                <p className="profile-field">
                  <strong>Phone Number:</strong>
                  <input
                    type="tel"
                    value={formData.emergencyContactNumber}
                    onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
                    className="profile-input"
                  />
                </p>
              </div>
            </div>

            <div className="profile-actions">
              <button type="submit">Create User</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="user-detail-container">
          <div className="user-actions">
            <button onClick={() => {
              setSelectedUser(null);
              setIsEditing(false);
              setIsCreating(false);
            }}>
            ← Back to Users List
          </button>
          {!isEditing && !isCreating && selectedUser.id && (
            <button onClick={() => handleEditStart(selectedUser)}>Edit User</button>
          )}
          </div>

          {(!isEditing && !isCreating) ? (
            <div className="user-detail">
              <h3>{selectedUser.name || selectedUser.username}</h3>

              <div className="detail-sections">
                <div className="detail-section">
                  <h3>Login and Contact</h3>
                  <p><strong>Username:</strong> {selectedUser.username}</p>
                  <p><strong>Password:</strong> ••••••••</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                  <p><strong>Email:</strong> {selectedUser.email || 'Not set'}</p>
                  <p><strong>Phone:</strong> {selectedUser.contactNumber || 'Not set'}</p>
                </div>

                <div className="detail-section">
                  <h3>Personal Information</h3>
                  <p><strong>Full Name:</strong> {selectedUser.name || 'Not set'}</p>
                  <p><strong>Nationality:</strong> {selectedUser.parentNationality || 'Not set'}</p>
                  <p><strong>Passport Number:</strong> {selectedUser.parentPassportNumber || 'Not set'}</p>
                  <p><strong>Passport Expiry:</strong> {selectedUser.parentPassportExpiryDate ? new Date(selectedUser.parentPassportExpiryDate).toLocaleDateString() : 'Not set'}</p>
                  <p><strong>NIF Number:</strong> {selectedUser.parentNifNumber || 'Not set'}</p>
                </div>

                <div className="detail-section">
                  <h3>Address</h3>
                  <p><strong>Street Address:</strong> {selectedUser.parentStreetAddress || 'Not set'}</p>
                  <p><strong>City:</strong> {selectedUser.parentCity || 'Not set'}</p>
                  <p><strong>Postal Code:</strong> {selectedUser.parentPostalCode || 'Not set'}</p>
                  <p><strong>Country:</strong> {selectedUser.parentCountry || 'Not set'}</p>
                </div>

                <div className="detail-section">
                  <h3>Emergency Contact</h3>
                  <p><strong>Relationship:</strong> {selectedUser.emergencyContactRelationship || 'Not set'}</p>
                  <p><strong>Name:</strong> {selectedUser.emergencyContactName || 'Not set'}</p>
                  <p><strong>Phone Number:</strong> {selectedUser.emergencyContactNumber || 'Not set'}</p>
                </div>

                {selectedUser.students && selectedUser.students.length > 0 && (
                  <div className="detail-section">
                    <h3>Students ({selectedUser.students.length})</h3>
                    <div className="students-list">
                      {selectedUser.students.map(student => (
                        <StudentCard
                          key={student._id}
                          student={student}
                          onView={handleViewStudent}
                          onEdit={handleEditStudent}
                          onDelete={handleDeleteStudent}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
          : isEditing ? (
              <form onSubmit={handleSave} className="user-form">
                <h3>Edit User: {selectedUser.username}</h3>

              <div className="profile-grid">
                <div className="profile-section">
                  <h3>Login Information</h3>
                  <p className="profile-field"><strong>Username:</strong> {selectedUser.username}</p>
                  <p className="profile-field">
                    <strong>Password:</strong>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Leave blank to keep current password"
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field"><strong>Role:</strong> {selectedUser.role}</p>
                  <p className="profile-field">
                    <strong>Email:</strong>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field">
                    <strong>Phone:</strong>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                </div>

                <div className="profile-section">
                  <h3>Personal Information</h3>
                  <p className="profile-field">
                    <strong>Full Name:</strong>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field">
                    <strong>Nationality:</strong>
                    <input
                      type="text"
                      value={formData.parentNationality}
                      onChange={(e) => handleInputChange('parentNationality', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field">
                    <strong>Passport Number:</strong>
                    <input
                      type="text"
                      value={formData.parentPassportNumber}
                      onChange={(e) => handleInputChange('parentPassportNumber', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field">
                    <strong>Passport Expiry:</strong>
                    <input
                      type="date"
                      value={formData.parentPassportExpiryDate}
                      onChange={(e) => handleInputChange('parentPassportExpiryDate', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field">
                    <strong>NIF Number:</strong>
                    <input
                      type="text"
                      value={formData.parentNifNumber}
                      onChange={(e) => handleInputChange('parentNifNumber', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                </div>

                <div className="profile-section">
                  <h3>Address</h3>
                  <p className="profile-field">
                    <strong>Street Address:</strong>
                    <input
                      type="text"
                      value={formData.parentStreetAddress}
                      onChange={(e) => handleInputChange('parentStreetAddress', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field">
                    <strong>City:</strong>
                    <input
                      type="text"
                      value={formData.parentCity}
                      onChange={(e) => handleInputChange('parentCity', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field">
                    <strong>Postal Code:</strong>
                    <input
                      type="text"
                      value={formData.parentPostalCode}
                      onChange={(e) => handleInputChange('parentPostalCode', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field">
                    <strong>Country:</strong>
                    <input
                      type="text"
                      value={formData.parentCountry}
                      onChange={(e) => handleInputChange('parentCountry', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                </div>

                <div className="profile-section">
                  <h3>Emergency Contact</h3>
                  <p className="profile-field">
                    <strong>Relationship:</strong>
                    <input
                      type="text"
                      value={formData.emergencyContactRelationship}
                      onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field">
                    <strong>Name:</strong>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                  <p className="profile-field">
                    <strong>Phone Number:</strong>
                    <input
                      type="tel"
                      value={formData.emergencyContactNumber}
                      onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
                      className="profile-input"
                    />
                  </p>
                </div>
              </div>

              <div className="profile-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          ) : null
        }
        </div>
      )}
      </div>
  )
}

export default Users