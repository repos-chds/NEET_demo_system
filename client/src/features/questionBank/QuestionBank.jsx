import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMagnifyingGlass, HiOutlineFunnel, HiOutlineEye } from 'react-icons/hi2';
import api from '../../services/api';

const SUBJECTS = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const subjectColors = {
  Physics: 'subject-physics',
  Chemistry: 'subject-chemistry',
  Botany: 'subject-botany',
  Zoology: 'subject-zoology',
};

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [chapters, setChapters] = useState({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ subject: '', chapter: '', difficulty: '', search: '' });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    loadChapters();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [filters, page]);

  const loadChapters = async () => {
    try {
      const res = await api.get('/questions/chapters');
      setChapters(res.data.data.subjects || {});
    } catch (err) {
      console.error(err);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (filters.subject) params.subject = filters.subject;
      if (filters.chapter) params.chapter = filters.chapter;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/questions', { params });
      setQuestions(res.data.data.questions || []);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const availableChapters = filters.subject && chapters[filters.subject]
    ? chapters[filters.subject].chapters
    : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Question Bank</h1>
        <p className="page-subtitle">{total} questions available</p>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label"><HiOutlineFunnel size={14} style={{ marginRight: 4 }} />Subject</label>
            <select className="form-select" value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value, chapter: '' })}>
              <option value="">All Subjects</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Chapter</label>
            <select className="form-select" value={filters.chapter}
              onChange={(e) => setFilters({ ...filters, chapter: e.target.value })}
              disabled={!filters.subject}>
              <option value="">All Chapters</option>
              {availableChapters.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label className="form-label">Difficulty</label>
            <select className="form-select" value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
              <option value="">All</option>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: '2 1 250px', position: 'relative' }}>
            <label className="form-label">Search</label>
            <div style={{ position: 'relative' }}>
              <HiOutlineMagnifyingGlass size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input className="form-input" style={{ paddingLeft: '2.25rem' }}
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Questions list */}
      {loading ? (
        <div className="spinner-container"><div className="spinner" /></div>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <h3>No questions found</h3>
          <p>Try adjusting your filters or run the seed script to add questions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {questions.map((q, i) => (
            <motion.div
              key={q._id}
              className="glass-card"
              style={{ padding: 'var(--space-lg)', cursor: 'pointer' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setPreview(preview?._id === q._id ? null : q)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    <span className={`badge ${subjectColors[q.subject]}`}>{q.subject}</span>
                    <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{q.chapter}</span>
                    <span className={`badge ${q.difficulty === 'Easy' ? 'badge-emerald' : q.difficulty === 'Hard' ? 'badge-rose' : 'badge-amber'}`}>{q.difficulty}</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {q.questionText}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm">
                  <HiOutlineEye size={16} />
                </button>
              </div>

              {preview?._id === q._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-primary)' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <div key={opt} style={{
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${opt === q.correctOption ? 'var(--accent-emerald)' : 'var(--border-primary)'}`,
                        background: opt === q.correctOption ? 'var(--accent-emerald-light)' : 'var(--bg-tertiary)',
                        fontSize: 'var(--text-sm)',
                      }}>
                        <strong style={{ color: opt === q.correctOption ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>{opt}.</strong>{' '}
                        {q[`option${opt}`]}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div style={{
                      marginTop: 'var(--space-md)', padding: 'var(--space-md)',
                      background: 'var(--accent-blue-light)', borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                    }}>
                      <strong style={{ color: 'var(--accent-blue)' }}>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              Page {page}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={questions.length < 30} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
