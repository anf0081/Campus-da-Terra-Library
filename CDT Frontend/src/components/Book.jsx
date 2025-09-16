const Book = ({ book, user, onBorrow, onReturn }) => {
  const isAvailable = !book.lending?.isLent
  const isAdmin = user && user.role === 'admin'
  const isBorrower =
    user &&
    book.lending?.borrower &&
    String(book.lending.borrower).trim() === String(user.id).trim()
  const canBorrow = user && user.role !== 'admin' && user.role !== 'tutor' && isAvailable

  let daysLeft = null
  if (isBorrower && book.lending?.dueDate) {
    const due = new Date(book.lending.dueDate)
    const now = new Date()
    daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="book-card">
      <strong>{book.title}</strong> by {book.author}
      <div>
        Status: {isAvailable ? 'Available' : isBorrower ? `You borrowed this book` : `Lent out`}
      </div>
      {(book.lending?.isLent && (isBorrower || isAdmin)) && (
        <div>
          {isBorrower && daysLeft !== null && (
            daysLeft >= 0
              ? <>Days left: {daysLeft}</>
              : <span style={{ color: 'red', fontWeight: 'bold' }}>
                  Overdue! Please return. {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''} late.
                </span>
          )}
          <button style={{ marginLeft: 8 }} onClick={() => onReturn(book.id)}>Return</button>
        </div>
      )}
      {canBorrow && (
        <button onClick={() => onBorrow(book.id)}>Borrow for 3 weeks</button>
      )}
    </div>
  )
}

export default Book