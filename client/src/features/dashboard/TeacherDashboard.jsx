import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineBookOpen,
  HiOutlineTv,
  HiOutlineArrowTrendingUp,
  HiOutlinePlusCircle,
} from 'react-icons/hi2';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, batches: 0, tests: 0, liveTests: 0 });
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [studentsRes, batchesRes, testsRes] = await Promise.all([
        api.get('/students?limit=1'),
        api.get('/batches'),
        api.get('/tests?limit=5'),
      ]);

      setStats({
        students: studentsRes.data.data.total || 0,
        batches: batchesRes.data.data.batches?.length || 0,
        tests: testsRes.data.data.total || 0,
        liveTests: testsRes.data.data.tests?.filter((t) => t.status === 'live').length || 0,
      });

      setRecentTests(testsRes.data.data.tests || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: HiOutlineUsers, color: 'var(--accent-blue)', bg: 'var(--accent-blue-light)' },
    { label: 'Batches', value: stats.batches, icon: HiOutlineBookOpen, color: 'var(--accent-emerald)', bg: 'var(--accent-emerald-light)' },
    { label: 'Total Tests', value: stats.tests, icon: HiOutlineClipboardDocumentList, color: 'var(--accent-violet)', bg: 'var(--accent-violet-light)' },
    { label: 'Live Tests', value: stats.liveTests, icon: HiOutlineTv, color: 'var(--accent-amber)', bg: 'var(--accent-amber-light)' },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner-container"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <motion.h1
          className="page-title"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </motion.h1>
        <p className="page-subtitle">Here's what's happening with your classes today.</p>
      </div>

      <motion.div className="grid-stats" variants={container} initial="hidden" animate="show">
        {statCards.map((stat) => (
          <motion.div key={stat.label} className="stat-card" variants={item}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  {stat.value}
                </div>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon size={24} color={stat.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ marginTop: 'var(--space-2xl)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        {/* Quick Actions */}
        <motion.div
          className="glass-card"
          style={{ padding: 'var(--space-xl)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-lg)' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <Link to="/teacher/tests/create" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              <HiOutlinePlusCircle size={18} />
              Create New Test
            </Link>
            <Link to="/teacher/students" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <HiOutlineUsers size={18} />
              Manage Students
            </Link>
            <Link to="/teacher/question-bank" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <HiOutlineBookOpen size={18} />
              Browse Question Bank
            </Link>
          </div>
        </motion.div>

        {/* Recent Tests */}
        <motion.div
          className="glass-card"
          style={{ padding: 'var(--space-xl)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-lg)' }}>Recent Tests</h2>
          {recentTests.length === 0 ? (
            <div className="empty-state">
              <p>No tests created yet. Create your first test!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {recentTests.map((test) => (
                <Link
                  key={test._id}
                  to={test.status === 'live' ? `/teacher/tests/${test._id}/monitor` : `/teacher/tests/${test._id}/results`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)', textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {test.name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {test.examCode || 'Draft'}
                    </div>
                  </div>
                  <span className={`badge ${
                    test.status === 'live' ? 'badge-emerald' :
                    test.status === 'completed' ? 'badge-blue' : 'badge-amber'
                  }`}>
                    {test.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
