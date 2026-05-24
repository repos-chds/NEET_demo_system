import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineArrowRightCircle, HiOutlineBookOpen } from 'react-icons/hi2';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [examCode, setExamCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/attempts/join', { examCode: examCode.trim().toUpperCase() });
      const { attempt, resumed } = res.data.data;
      navigate(`/student/exam/${attempt._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <motion.h1
          className="page-title"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Welcome, {user?.name} 👋
        </motion.h1>
        <p className="page-subtitle">Enter an exam code to start a test</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', maxWidth: 900 }}>
        {/* Join Test */}
        <motion.div
          className="glass-card"
          style={{ padding: 'var(--space-xl)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-xl)',
            background: 'var(--accent-blue-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-lg)',
          }}>
            <HiOutlineBookOpen size={28} color="var(--accent-blue)" />
          </div>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-sm)' }}>Join Test</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-lg)' }}>
            Enter the 6-character exam code provided by your teacher
          </p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleJoin}>
            <div className="form-group">
              <input
                className="form-input"
                placeholder="Enter Exam Code"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
                style={{
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  letterSpacing: '0.3em',
                  padding: '1rem',
                }}
                autoFocus
                id="exam-code-input"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading || examCode.length !== 6}
              id="join-test-btn"
            >
              {loading ? 'Joining...' : <>Join Test <HiOutlineArrowRightCircle size={18} /></>}
            </button>
          </form>
        </motion.div>

        {/* Instructions */}
        <motion.div
          className="glass-card"
          style={{ padding: 'var(--space-xl)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-lg)' }}>Instructions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {[
              'This is a NEET UG pattern mock test',
              '200 questions: 35 (Section A) + 15 (Section B) per subject',
              'Section A: All 35 questions are mandatory',
              'Section B: Attempt any 10 out of 15 questions',
              'Marking: +4 for correct, −1 for incorrect, 0 for unattempted',
              'Maximum marks: 720',
              'Your answers are auto-saved',
              'You can mark questions for review and come back later',
              'Test will auto-submit when time runs out',
            ].map((instruction, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--accent-blue-light)', color: 'var(--accent-blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0, marginTop: 1,
                }}>
                  {i + 1}
                </span>
                {instruction}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
