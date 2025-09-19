import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import dashboardService from '../services/dashboards'
import studentService from '../services/students'
import PortfolioSection from './PortfolioSection'
import DocumentsSection from './DocumentsSection'
import HistorySection from './HistorySection'
import WishlistSection from './WishlistSection'

const StudentDashboard = ({ user, setMessage, setClassName }) => {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const [dashboard, setDashboard] = useState(null)
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

    const isAdmin = user?.role === 'admin'

   const fetchStudent = useCallback( async () => {
      try {
        setLoading(true)
        if (!user?.token) {
          setLoading(false)
          return
        }

        studentService.setToken(user.token)
        dashboardService.setToken(user.token)
        // Fetch student data first to check permissions
        const studentDatas = await studentService.getAll()
        const studentData = studentDatas.find(s => s.id === studentId)
        if (!studentData) {
          setError('Student not found')
          setMessage('Student not found')
          setClassName('error')
          setTimeout(() => setMessage(null), 5000)
          return
        }
        setStudent(studentData)
        // If user is not admin, ensure they own the student record
        const isOwner = studentData.userId.toString() === user?.id
          if (!isOwner && !isAdmin) {
            setError('Access denied: You can only view your own dashboard')
            return
          }

        const dashboardData = await dashboardService.getByStudentId(studentId)
        setDashboard(dashboardData)
      }
      catch (error) {
        if (error.response?.status === 403) {
          setError('Access denied: You can only view your own dashboard')
        } else if (error.response?.status === 404) {
          setError('Student not found')
        } else {
          setError('Failed to load dashboard')
        }
        setMessage('Error fetching student dashboard')
        setClassName('error')
        setTimeout(() => setMessage(null), 5000)
      } finally {
        setLoading(false)
      }
    }, [studentId, user, isAdmin, setMessage, setClassName])



  useEffect(() => {
    fetchStudent(user)
  }, [fetchStudent, user])

  const updateDashboard = (updatedDashboard) => {
    setDashboard(updatedDashboard)
  }

  const showMessage = (message, type = 'success') => {
    setMessage(message)
    setClassName(type)
    setTimeout(() => {
      setMessage(null)
      setClassName('error')
    }, 5000)
  }

  if (!user) {
    return <div className="dashboard-container">Please log in to view dashboard</div>
  }

  if (loading) {
    return <div className="dashboard-container"><div className="flex flex-col items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div><p className="mt-4">Loading dashboard...</p></div></div>
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="text-error text-center py-8">{error}</div>
        <div className="text-center">
          <button className="btn-terra" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    )
  }

  if (!dashboard || !student) {
    return <div className="dashboard-container">Dashboard not found</div>
  }

  const studentName = `${student.firstName} ${student.lastName}`

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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          {student.profilePicture ? (
            <img
              src={getProfilePictureUrl(student.profilePicture)}
              alt={studentName}
              className="student-avatar student-avatar-large"
            />
          ) : (
            <div className="student-avatar student-avatar-large placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          )}
          <div className="dashboard-student-info">
            <h1>Dashboard - {studentName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <button className="outlined" onClick={() => navigate('/students')}>← Back to Student List</button>
            <button
              onClick={() => navigate('/students', { state: { selectedStudent: student, mode: 'view' } })}
              className="btn-terra outlined"
            >
              View Student Data
            </button>
        </div>
      </div>

        <div className="dashboard-content">
        <WishlistSection
          studentId={studentId}
          user={user}
          showMessage={showMessage}
        />

        <PortfolioSection
          studentId={studentId}
          portfolios={dashboard.portfolios}
          isAdmin={isAdmin}
          onUpdate={updateDashboard}
          showMessage={showMessage}
        />

        <DocumentsSection
          studentId={studentId}
          documents={dashboard.documents}
          isAdmin={isAdmin}
          onUpdate={updateDashboard}
          showMessage={showMessage}
        />

        <HistorySection
          studentId={studentId}
          history={dashboard.history}
          isAdmin={isAdmin}
          onUpdate={updateDashboard}
          showMessage={showMessage}
        />
      </div>
    </div>
  )
}

export default StudentDashboard