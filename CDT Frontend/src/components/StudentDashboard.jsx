import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import dashboardService from '../services/dashboards'
import studentService from '../services/students'
import PortfolioSection from './PortfolioSection'
import DocumentsSection from './DocumentsSection'
import HistorySection from './HistorySection'

const StudentDashboard = ({ user, setMessage, setClassName }) => {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const [dashboard, setDashboard] = useState(null)
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

    const isAdmin = user && user.role === 'admin'

   const fetchStudent = useCallback( async () => {
      try {
        setLoading(true)
        if (user?.token) {
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
    return <div className="dashboard-container"><div className="loading">Loading dashboard...</div></div>
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    )
  }

  if (!dashboard || !student) {
    return <div className="dashboard-container">Dashboard not found</div>
  }

  const studentName = `${student.firstName} ${student.lastName}`

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Student Dashboard - {studentName}</h1>
        {isAdmin && <span className="admin-badge">Admin View</span>}
      </div>


        <div className="dashboard-content">
        <PortfolioSection
          studentId={studentId}
          portfolio={dashboard.portfolio}
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