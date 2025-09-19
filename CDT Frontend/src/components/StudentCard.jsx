import useSecureImage from '../hooks/useSecureImage'

const StudentCard = ({ student, onView, onEdit, onDelete, onDashboard }) => {
  const { imageUrl, loading: imageLoading } = useSecureImage(student.profilePicture ? student.id || student._id : null)

  return (
    <div key={student.id || student._id} className="student-card">
      <div className="student-card-header">
        {student.profilePicture && imageUrl ? (
          <img
            src={imageUrl}
            alt={`${student.firstName} ${student.lastName}`}
            className="student-avatar student-avatar-small"
          />
        ) : imageLoading ? (
          <div className="student-avatar student-avatar-small placeholder">
            <div className="loading-spinner">...</div>
          </div>
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