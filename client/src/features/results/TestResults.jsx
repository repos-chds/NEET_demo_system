import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HiOutlineTrophy, HiOutlineChevronLeft } from 'react-icons/hi2';
import api from '../../services/api';

const COLORS = ['var(--accent-emerald)', 'var(--accent-rose)', 'var(--accent-amber)'];
const SUBJECT_COLORS = {
  Physics: '#3b82f6',
  Chemistry: '#10b981',
  Botany: '#f59e0b',
  Zoology: '#f43f5e',
};

export default function TestResults() {
  const { id } = useParams();
  const [results, setResults] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      const [resResults, resAnalytics] = await Promise.all([
        api.get(`/results/test/${id}`),
        api.get(`/results/test/${id}/analytics`),
      ]);
      setResults(resResults.data.data);
      setAnalytics(resAnalytics.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="spinner-container"><div className="spinner" /></div></div>;
  if (!results) return <div className="page-container"><div className="empty-state"><h3>Results not available</h3></div></div>;

  const pieData = analytics ? [
    { name: 'Correct', value: results.leaderboard.reduce((a, b) => a + b.totalCorrect, 0) },
    { name: 'Incorrect', value: results.leaderboard.reduce((a, b) => a + b.totalIncorrect, 0) },
    { name: 'Unattempted', value: results.leaderboard.reduce((a, b) => a + b.totalUnattempted, 0) },
  ] : [];

  const subjectData = analytics ? Object.entries(analytics.subjectAverages).map(([subj, data]) => ({
    subject: subj,
    average: data.average,
    highest: data.highest,
  })) : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/teacher/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>
          <HiOutlineChevronLeft size={14} /> Back to Dashboard
        </Link>
        <h1 className="page-title">{results.test.name} — Results</h1>
        <p className="page-subtitle">{results.totalAttempts} students attempted • Max marks: {results.test.totalMarks}</p>
      </div>

      {/* Analytics overview */}
      {analytics && analytics.totalStudents > 0 && (
        <>
          <div className="grid-stats" style={{ marginBottom: 'var(--space-xl)' }}>
            {[
              { label: 'Average Score', value: analytics.averageScore, color: 'var(--accent-blue)' },
              { label: 'Highest Score', value: analytics.highestScore, color: 'var(--accent-emerald)' },
              { label: 'Lowest Score', value: analytics.lowestScore, color: 'var(--accent-rose)' },
              { label: 'Students', value: analytics.totalStudents, color: 'var(--accent-violet)' },
            ].map((stat) => (
              <motion.div key={stat.label} className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{stat.label}</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-heading)' }}>
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
            <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
              <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: 'var(--text-lg)' }}>Subject-wise Average Scores</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectData}>
                  <XAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                    {subjectData.map((entry) => (
                      <Cell key={entry.subject} fill={SUBJECT_COLORS[entry.subject]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
              <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: 'var(--text-lg)' }}>Overall Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-lg)', marginTop: 'var(--space-sm)' }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Leaderboard */}
      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-lg)' }}>
        <HiOutlineTrophy size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--accent-amber)' }} />
        Leaderboard
      </h2>
      {results.leaderboard.length === 0 ? (
        <div className="empty-state"><h3>No submissions yet</h3></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Batch</th>
                <th>Score</th>
                <th>Correct</th>
                <th>Incorrect</th>
                <th>Unattempted</th>
                <th>Physics</th>
                <th>Chemistry</th>
                <th>Botany</th>
                <th>Zoology</th>
              </tr>
            </thead>
            <tbody>
              {results.leaderboard.map((r) => (
                <tr key={r.rank}>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: r.rank <= 3 ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    }}>
                      {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.studentName}</td>
                  <td>{r.batchName}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                    {r.score}/{results.test.totalMarks}
                  </td>
                  <td style={{ color: 'var(--accent-emerald)' }}>{r.totalCorrect}</td>
                  <td style={{ color: 'var(--accent-rose)' }}>{r.totalIncorrect}</td>
                  <td style={{ color: 'var(--text-tertiary)' }}>{r.totalUnattempted}</td>
                  <td style={{ color: SUBJECT_COLORS.Physics }}>{r.subjectWise?.Physics?.score || 0}</td>
                  <td style={{ color: SUBJECT_COLORS.Chemistry }}>{r.subjectWise?.Chemistry?.score || 0}</td>
                  <td style={{ color: SUBJECT_COLORS.Botany }}>{r.subjectWise?.Botany?.score || 0}</td>
                  <td style={{ color: SUBJECT_COLORS.Zoology }}>{r.subjectWise?.Zoology?.score || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
