const UserCard = ({ user, onView, onEdit, onDelete }) => {
  return (
    <div key={user.id || user._id} className="user-card">
      <h3>{user.name || user.username}</h3>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email || 'Not set'}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <p><strong>Students:</strong> {user.students?.length || 0}</p>
      <div className="user-actions">
        <button onClick={() => onView(user)}>View</button>
        <button onClick={() => onEdit(user)}>Edit</button>
        <button className="delete-btn" onClick={() => onDelete(user.id || user._id)}>Delete</button>
      </div>
    </div>
  )
}

export default UserCard