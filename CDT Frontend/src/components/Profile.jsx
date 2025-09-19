import { useState } from 'react'
import userService from '../services/users'

const Profile = ({ user, setUser, setMessage, setClassName }) => {
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '')
  const [parentStreetAddress, setParentStreetAddress] = useState(user?.parentStreetAddress || '')
  const [parentCity, setParentCity] = useState(user?.parentCity || '')
  const [parentPostalCode, setParentPostalCode] = useState(user?.parentPostalCode || '')
  const [parentCountry, setParentCountry] = useState(user?.parentCountry || '')
  const [parentNationality, setParentNationality] = useState(user?.parentNationality || '')
  const [parentPassportNumber, setParentPassportNumber] = useState(user?.parentPassportNumber || '')
  const [parentPassportExpiryDate, setParentPassportExpiryDate] = useState(user?.parentPassportExpiryDate ? user.parentPassportExpiryDate.split('T')[0] : '')
  const [parentNifNumber, setParentNifNumber] = useState(user?.parentNifNumber || '')
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState(user?.emergencyContactRelationship || '')
  const [emergencyContactName, setEmergencyContactName] = useState(user?.emergencyContactName || '')
  const [emergencyContactNumber, setEmergencyContactNumber] = useState(user?.emergencyContactNumber || '')
  const [password, setPassword] = useState('')
  const [isEditing, setIsEditing] = useState(false)


  const handleEditStart = () => {
    // Populate fields with current user data when starting to edit
    setName(user?.name || '')
    setEmail(user?.email || '')
    setContactNumber(user?.contactNumber || '')
    setParentStreetAddress(user?.parentStreetAddress || '')
    setParentCity(user?.parentCity || '')
    setParentPostalCode(user?.parentPostalCode || '')
    setParentCountry(user?.parentCountry || '')
    setParentNationality(user?.parentNationality || '')
    setParentPassportNumber(user?.parentPassportNumber || '')
    setParentPassportExpiryDate(user?.parentPassportExpiryDate ? user.parentPassportExpiryDate.split('T')[0] : '')
    setParentNifNumber(user?.parentNifNumber || '')
    setEmergencyContactRelationship(user?.emergencyContactRelationship || '')
    setEmergencyContactName(user?.emergencyContactName || '')
    setEmergencyContactNumber(user?.emergencyContactNumber || '')
    setPassword('')
    setIsEditing(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    console.log('Form submitted - starting save process')
    try {
      const profileData = {
        name,
        email,
        contactNumber,
        parentStreetAddress,
        parentCity,
        parentPostalCode,
        parentCountry,
        parentNationality,
        parentPassportNumber,
        parentPassportExpiryDate,
        parentNifNumber,
        emergencyContactRelationship,
        emergencyContactName,
        emergencyContactNumber
      }

      // Filter out empty string values to avoid enum validation errors
      const cleanedProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([, value]) => value !== '')
      )

      // Only include password if it's provided
      if (password.trim()) {
        cleanedProfileData.password = password
      }

      console.log('Profile data to send:', cleanedProfileData)
      console.log('User ID:', user.id)

      const updatedUser = await userService.update(user.id, cleanedProfileData)
      console.log('Received updated user:', updatedUser)

      // Preserve the original token when updating user data
      const userWithToken = { ...updatedUser, token: user.token }
      setUser(userWithToken)

      // Update localStorage with the new user data (including token)
      window.localStorage.setItem('loggedlibraryUser', JSON.stringify(userWithToken))

      setMessage('Profile updated successfully')
      setClassName('success')
      setIsEditing(false)
      setTimeout(() => {
        setMessage(null)
        setClassName('error')
      }, 5000)
    } catch (error) {
      const backendMsg = error.response?.data?.error
      setMessage(backendMsg || 'Error updating profile')
      setClassName('error')
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <div>
      <h2>Profile</h2>
      <div className="profile-container">
        {!isEditing &&
        <div className="profile-actions">
              <button className="outlined" onClick={handleEditStart}>Edit Profile</button>
        </div>
        }
        {!isEditing ? (
          <>
          <div className="profile-grid">
            <div className="profile-section">
              <h3>Login and Contact</h3>
              <p><strong>Username:</strong> {user?.username}</p>
              <p><strong>Password:</strong> ••••••••</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>Email:</strong> {user?.email || 'Not set'}</p>
              <p><strong>Phone:</strong> {user?.contactNumber || 'Not set'}</p>
            </div>

            <div className="profile-section">
              <h3>Personal Information</h3>
              <p><strong>Full Name:</strong> {user?.name || 'Not set'}</p>
              <p><strong>Nationality:</strong> {user?.parentNationality || 'Not set'}</p>
              <p><strong>Passport Number:</strong> {user?.parentPassportNumber || 'Not set'}</p>
              <p><strong>Passport Expiry:</strong> {user?.parentPassportExpiryDate ? new Date(user.parentPassportExpiryDate).toLocaleDateString() : 'Not set'}</p>
              <p><strong>NIF Number:</strong> {user?.parentNifNumber || 'Not set'}</p>
            </div>

            <div className="profile-section">
              <h3>Address</h3>
              <p><strong>Street Address:</strong> {user?.parentStreetAddress || 'Not set'}</p>
              <p><strong>City:</strong> {user?.parentCity || 'Not set'}</p>
              <p><strong>Postal Code:</strong> {user?.parentPostalCode || 'Not set'}</p>
              <p><strong>Country:</strong> {user?.parentCountry || 'Not set'}</p>
            </div>

            <div className="profile-section">
              <h3>Emergency Contact</h3>
              <p><strong>Relationship:</strong> {user?.emergencyContactRelationship || 'Not set'}</p>
              <p><strong>Name:</strong> {user?.emergencyContactName || 'Not set'}</p>
              <p><strong>Phone Number:</strong> {user?.emergencyContactNumber || 'Not set'}</p>
            </div>
          </div>
            </>
        ) : (
          <form onSubmit={handleSave} className="student-form">
            <div className="form-sections">
              <div className="form-section">
                <h3>Login Information</h3>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nationality</label>
                  <input
                    type="text"
                    value={parentNationality}
                    onChange={(e) => setParentNationality(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Passport Number</label>
                  <input
                    type="text"
                    value={parentPassportNumber}
                    onChange={(e) => setParentPassportNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Passport Expiry</label>
                  <input
                    type="date"
                    value={parentPassportExpiryDate}
                    onChange={(e) => setParentPassportExpiryDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>NIF Number</label>
                  <input
                    type="text"
                    value={parentNifNumber}
                    onChange={(e) => setParentNifNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Address</h3>
                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={parentStreetAddress}
                    onChange={(e) => setParentStreetAddress(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={parentCity}
                    onChange={(e) => setParentCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={parentPostalCode}
                    onChange={(e) => setParentPostalCode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={parentCountry}
                    onChange={(e) => setParentCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Emergency Contact</h3>
                <div className="form-group">
                  <label>Relationship</label>
                  <input
                    type="text"
                    value={emergencyContactRelationship}
                    onChange={(e) => setEmergencyContactRelationship(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={emergencyContactNumber}
                    onChange={(e) => setEmergencyContactNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit">Save</button>
              <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Profile