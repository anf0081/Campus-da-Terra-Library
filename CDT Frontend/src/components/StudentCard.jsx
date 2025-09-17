const StudentCard = ({ student, onView, onEdit, onDelete, onDashboard }) => {
  return (
    <div key={student.id || student._id} className="student-card">
      <h3>{student.firstName} {student.lastName}</h3>
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