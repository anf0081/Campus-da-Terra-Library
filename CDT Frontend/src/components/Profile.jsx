import { useState } from 'react'

const Profile = ({ user }) => {
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = (event) => {
    event.preventDefault()
    // TODO: Add API call to update user profile
    console.log('Saving profile:', { name, email })
    setIsEditing(false)
  }

  return (
    <div>
      <h2>Profile</h2>
      <div style={{ maxWidth: '400px', margin: '2rem 0' }}>
        {!isEditing ? (
          <div>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email || 'Not set'}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
              />
            </div>
            <div style={{ gap: '0.5rem', display: 'flex' }}>
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