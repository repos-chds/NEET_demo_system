import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineUsers, HiOutlineClipboard, HiOutlineArrowPath,
  HiOutlineStopCircle, HiOutlineChartBarSquare,
} from 'react-icons/hi2';
import api from '../../services/api';

export default function LiveMonitoring() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/tests/${id}/monitoring`);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleComplete = async () => {
    if (!confirm('End this test? All in-progress attempts will be auto-submitted.')) return;
    await api.post(`/tests/${id}/complete`);
    fetchData();
  };

  const copyCode = () => {
    if (data?.test?.examCode) {
      navigator.clipboard.writeText(data.test.examCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return <div className="page-container"><div className="spinner-container"><div className="spinner" /></div></div>;
  }

  if (!data) {
    return <div className="page-container"><div className="empty-state"><h3>Test not found</h3></div></div>;
  }

  const { test, summary, students } = data;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{test.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
            <span className={`badge ${test.status === 'live' ? 'badge-emerald' : 'badge-blue'}`}>{test.status}</span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 700,
              color: 'var(--accent-blue)', letterSpacing: '0.2em',
            }}>
              {test.examCode}
              <button className="btn btn-ghost btn-sm" onClick={copyCode}>
                <HiOutlineClipboard size={16} />
                {copiedCode ? 'Copied!' : ''}
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-ghost" onClick={fetchData}><HiOutlineArrowPath size={16} /> Refresh</button>
          {test.status === 'live' && (
            <button className="btn btn-danger" onClick={handleComplete}>
              <HiOutlineStopCircle size={16} /> End Test
            </button>
          )}
          {test.status === 'completed' && (
            <Link to={`/teacher/tests/${id}/results`} className="btn btn-primary">
              <HiOutlineChartBarSquare size={16} /> View Results
            </Link>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { label: 'Total Eligible', value: summary.total, color: 'var(--accent-blue)' },
          { label: 'Joined', value: summary.joined, color: 'var(--accent-violet)' },
          { label: 'In Progress', value: summary.inProgress, color: 'var(--accent-amber)' },
          { label: 'Submitted', value: summary.submitted, color: 'var(--accent-emerald)' },
        ].map((stat) => (
          <motion.div key={stat.label} className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{stat.label}</div>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-heading)' }}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Students table */}
      {students.length === 0 ? (
        <div className="empty-state">
          <HiOutlineUsers size={48} />
          <h3>No students have joined yet</h3>
          <p>Share the exam code with your students to get started</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Username</th>
                <th>Status</th>
                <th>Answered</th>
                <th>Started</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s._id || i}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{s.username}</code></td>
                  <td>
                    <span className={`badge ${
                      s.status === 'in_progress' ? 'badge-amber' :
                      s.status === 'submitted' ? 'badge-emerald' : 'badge-blue'
                    }`}>
                      {s.status === 'in_progress' ? 'In Progress' :
                       s.status === 'submitted' ? 'Submitted' : 'Auto-Submitted'}
                    </span>
                  </td>
                  <td>{s.answeredCount}/180</td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {s.startedAt ? new Date(s.startedAt).toLocaleTimeString() : '—'}
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{
        textAlign: 'center', marginTop: 'var(--space-lg)',
        fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
      }}>
        Auto-refreshing every 5 seconds
      </div>
    </div>
  );
}
