import { useState } from 'react'
import { createPortal } from 'react-dom'

const WishlistPopup = ({ book, students, onClose, onAddToWishlist }) => {
  const [selectedStudentIds, setSelectedStudentIds] = useState([])

  const handleStudentToggle = (studentId) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSubmit = () => {
    if (selectedStudentIds.length > 0) {
      onAddToWishlist(selectedStudentIds)
    }
  }

  return createPortal(
    <div className="form-popup-overlay" onClick={onClose}>
      <div className="form-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Add "{book.title}" to Wishlist</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="history-content">
          <p>Select which students should have this book added to their wishlist:</p>
          <div className="checkbox-list">
            {students.map(student => (
              <div key={student.id} className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                  />
                  {student.firstName} {student.lastName}
                </label>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedStudentIds.length === 0}
            >
              Add to Wishlist ({selectedStudentIds.length})
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default WishlistPopup