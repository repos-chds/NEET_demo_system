import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HiOutlineHome, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import api from '../../services/api';

const SUBJECT_COLORS = {
  Physics: '#3b82f6',
  Chemistry: '#10b981',
  Botany: '#f59e0b',
  Zoology: '#f43f5e',
};

export default function StudentResult() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, [attemptId]);

  const loadResult = async () => {
    try {
      const res = await api.get(`/results/attempt/${attemptId}`);
      setResult(res.data.data.attempt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="spinner-container"><div className="spinner" /></div></div>;
  if (!result) return <div className="page-container"><div className="empty-state"><h3>Result not found</h3></div></div>;

  const subjectData = Object.entries(result.subjectWise || {}).map(([subj, data]) => ({
    subject: subj,
    score: data.score,
    correct: data.correct,
    incorrect: data.incorrect,
  }));

  const percentage = result.test?.totalMarks ? Math.round((result.score / result.test.totalMarks) * 100) : 0;

  return (
    <div className="page-container" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Score Card */}
      <motion.div
        className="glass-card"
        style={{ padding: 'var(--space-2xl)', textAlign: 'center', marginBottom: 'var(--space-xl)' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h1 className="page-title" style={{ marginBottom: 'var(--space-sm)' }}>{result.test?.name}</h1>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-xl)' }}>
          {result.status === 'auto_submitted' ? 'Auto-submitted (time expired)' : 'Submitted'} •{' '}
          {new Date(result.submittedAt).toLocaleString()}
        </p>

        <div style={{
          width: 160, height: 160, borderRadius: '50%', margin: '0 auto var(--space-xl)',
          background: `conic-gradient(var(--accent-blue) ${percentage * 3.6}deg, var(--bg-tertiary) 0deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: 130, height: 130, borderRadius: '50%', background: 'var(--bg-secondary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent-blue)' }}>
              {result.score}
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              / {result.test?.totalMarks || 720}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)', maxWidth: 500, margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              <HiOutlineCheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {result.totalCorrect}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Correct</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-rose)' }}>
              <HiOutlineXCircle size={20} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {result.totalIncorrect}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Incorrect</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {result.totalUnattempted}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Unattempted</div>
          </div>
        </div>
      </motion.div>

      {/* Subject-wise Chart */}
      <motion.div
        className="glass-card"
        style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-lg)' }}>Subject-wise Scores</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={subjectData}>
            <XAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {subjectData.map((entry) => (
                <Cell key={entry.subject} fill={SUBJECT_COLORS[entry.subject]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Subject detail cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
          {subjectData.map((s) => (
            <div key={s.subject} style={{
              padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-tertiary)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: SUBJECT_COLORS[s.subject], marginBottom: 'var(--space-xs)' }}>
                {s.subject}
              </div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{s.score}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                ✓{s.correct} ✗{s.incorrect}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div style={{ textAlign: 'center' }}>
        <Link to="/student/dashboard" className="btn btn-secondary">
          <HiOutlineHome size={16} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
