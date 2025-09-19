const StudentCard = ({ student, onView, onEdit, onDelete, onDashboard }) => {
  // Helper function to get profile picture URL
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return null

    // If it's already a full URL (Cloudinary), use it directly
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture
    }

    // If it's a relative path (legacy), prepend API URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'
    return `${API_URL}${profilePicture}`
  }

  return (
    <div key={student.id || student._id} className="student-card">
      <div className="student-card-header">
        {student.profilePicture ? (
          <img
            src={getProfilePictureUrl(student.profilePicture)}
            alt={`${student.firstName} ${student.lastName}`}
            className="student-avatar student-avatar-small"
          />
        ) : (
          <div className="student-avatar student-avatar-small placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        )}
        <div className="student-card-info">
          <h3>{student.firstName} {student.lastName}</h3>
        </div>
      </div>

      <p><strong>Age:</strong> {student.dateOfBirth ? Math.floor((new Date() - new Date(student.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'}</p>
      <p><strong>Gender:</strong> {student.gender || 'Not set'}</p>
      <p><strong>Nationality:</strong> {student.nationality || 'Not set'}</p>
      <p><strong>Enrollment:</strong> {student.enrollmentLength || 'Not set'}</p>
      <div className="student-actions">
        {onDashboard && <button onClick={() => onDashboard(student.id || student._id)}>Dashboard</button>}
        <button onClick={() => onView(student)}>View</button>
        <button onClick={() => onEdit(student)}>Edit</button>
        <button onClick={() => onDelete(student.id || student._id)} className="delete-btn">Delete</button>
      </div>
    </div>
  )
}

export default StudentCard