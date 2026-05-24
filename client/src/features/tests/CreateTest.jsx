import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineChevronRight, HiOutlineChevronLeft, HiOutlineCheck,
  HiOutlinePlusCircle, HiOutlineXMark, HiOutlineClipboard,
} from 'react-icons/hi2';
import api from '../../services/api';

const SUBJECTS = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
const STEPS = ['Basic Info', 'Select Questions', 'Assign Students', 'Review & Publish'];

export default function CreateTest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [testName, setTestName] = useState('');
  const [duration, setDuration] = useState(200);
  const [selectedQuestions, setSelectedQuestions] = useState({
    Physics: { sectionA: [], sectionB: [] },
    Chemistry: { sectionA: [], sectionB: [] },
    Botany: { sectionA: [], sectionB: [] },
    Zoology: { sectionA: [], sectionB: [] },
  });
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);

  // Data
  const [questions, setQuestions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [activeSection, setActiveSection] = useState('sectionA');
  const [chapters, setChapters] = useState({});
  const [filterChapter, setFilterChapter] = useState('');

  // Result
  const [createdTest, setCreatedTest] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (step === 1) loadQuestions();
  }, [step, activeSubject, filterChapter]);

  const loadData = async () => {
    try {
      const [batchRes, chapRes] = await Promise.all([
        api.get('/batches'),
        api.get('/questions/chapters'),
      ]);
      setBatches(batchRes.data.data.batches || []);
      setChapters(chapRes.data.data.subjects || {});
    } catch (err) { console.error(err); }
  };

  const loadQuestions = async () => {
    try {
      const params = { subject: activeSubject, limit: 100 };
      if (filterChapter) params.chapter = filterChapter;
      const res = await api.get('/questions', { params });
      setQuestions(res.data.data.questions || []);
    } catch (err) { console.error(err); }
  };

  const toggleQuestion = (qId) => {
    setSelectedQuestions((prev) => {
      const current = prev[activeSubject][activeSection];
      const maxA = 35, maxB = 15;
      const max = activeSection === 'sectionA' ? maxA : maxB;

      if (current.includes(qId)) {
        return {
          ...prev,
          [activeSubject]: {
            ...prev[activeSubject],
            [activeSection]: current.filter((id) => id !== qId),
          },
        };
      }

      if (current.length >= max) return prev;

      return {
        ...prev,
        [activeSubject]: {
          ...prev[activeSubject],
          [activeSection]: [...current, qId],
        },
      };
    });
  };

  const autoFill = async () => {
    // Auto-fill remaining slots for current subject/section
    const maxA = 35, maxB = 15;
    const max = activeSection === 'sectionA' ? maxA : maxB;
    const current = selectedQuestions[activeSubject][activeSection];
    const remaining = max - current.length;
    if (remaining <= 0) return;

    const available = questions.filter((q) => !current.includes(q._id));
    const toAdd = available.slice(0, remaining).map((q) => q._id);

    setSelectedQuestions((prev) => ({
      ...prev,
      [activeSubject]: {
        ...prev[activeSubject],
        [activeSection]: [...current, ...toAdd],
      },
    }));
  };

  const loadStudentsForAssignment = async () => {
    try {
      const res = await api.get('/students?limit=200');
      setStudents(res.data.data.students || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (step === 2) loadStudentsForAssignment();
  }, [step]);

  const getTotalSelected = () => {
    let total = 0;
    for (const subj of SUBJECTS) {
      total += selectedQuestions[subj].sectionA.length;
      total += selectedQuestions[subj].sectionB.length;
    }
    return total;
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      // Create test
      const createRes = await api.post('/tests', {
        name: testName,
        duration,
        sections: selectedQuestions,
      });

      const testId = createRes.data.data.test._id;

      // Update assignments
      await api.put(`/tests/${testId}`, {
        assignedBatches,
        assignedStudents,
      });

      // Publish
      const pubRes = await api.post(`/tests/${testId}/publish`);
      setCreatedTest(pubRes.data.data.test);
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish test');
    } finally {
      setLoading(false);
    }
  };

  const copyExamCode = () => {
    if (createdTest?.examCode) {
      navigator.clipboard.writeText(createdTest.examCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const availableChapters = chapters[activeSubject]?.chapters || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Create Test</h1>
        <p className="page-subtitle">Set up a NEET mock test for your students</p>
      </div>

      {/* Step indicator */}
      <div style={{
        display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xl)',
        padding: 'var(--space-md)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-primary)',
      }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
            padding: '0.625rem 1rem', borderRadius: 'var(--radius-md)',
            background: i === step ? 'var(--accent-blue-light)' : i < step ? 'var(--accent-emerald-light)' : 'transparent',
            fontSize: 'var(--text-sm)', fontWeight: 600,
            color: i === step ? 'var(--accent-blue)' : i < step ? 'var(--accent-emerald)' : 'var(--text-tertiary)',
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= step ? (i < step ? 'var(--accent-emerald)' : 'var(--accent-blue)') : 'var(--bg-tertiary)',
              color: 'white', fontSize: 'var(--text-xs)',
            }}>
              {i < step ? <HiOutlineCheck size={14} /> : i + 1}
            </span>
            {s}
          </div>
        ))}
      </div>

      {/* Step 0: Basic Info */}
      {step === 0 && (
        <motion.div className="glass-card" style={{ padding: 'var(--space-xl)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="form-group">
            <label className="form-label">Test Name</label>
            <input className="form-input" placeholder="e.g. NEET Mock Test #1" value={testName}
              onChange={(e) => setTestName(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Duration (minutes)</label>
            <input type="number" className="form-input" value={duration}
              onChange={(e) => setDuration(Number(e.target.value))} min={10} max={300} />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
              NEET standard: 200 minutes (3h 20m)
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
            <button className="btn btn-primary" disabled={!testName.trim()} onClick={() => setStep(1)}>
              Next <HiOutlineChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 1: Select Questions */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Subject tabs */}
          <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
            {SUBJECTS.map((subj) => {
              const count = selectedQuestions[subj].sectionA.length + selectedQuestions[subj].sectionB.length;
              return (
                <button key={subj} className={`exam-subject-tab ${activeSubject === subj ? 'active' : ''}`}
                  onClick={() => { setActiveSubject(subj); setFilterChapter(''); }}>
                  {subj} ({count}/50)
                </button>
              );
            })}
          </div>

          {/* Section tabs */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', alignItems: 'center' }}>
            <button className={`btn ${activeSection === 'sectionA' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveSection('sectionA')}>
              Section A ({selectedQuestions[activeSubject].sectionA.length}/35)
            </button>
            <button className={`btn ${activeSection === 'sectionB' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveSection('sectionB')}>
              Section B ({selectedQuestions[activeSubject].sectionB.length}/15)
            </button>
            <div style={{ flex: 1 }} />
            <select className="form-select" style={{ maxWidth: 200, padding: '0.375rem 0.625rem', fontSize: 'var(--text-sm)' }}
              value={filterChapter} onChange={(e) => setFilterChapter(e.target.value)}>
              <option value="">All Chapters</option>
              {availableChapters.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={autoFill}>
              <HiOutlinePlusCircle size={14} /> Auto-Fill
            </button>
          </div>

          {/* Questions grid */}
          <div className="glass-card" style={{ padding: 'var(--space-lg)', maxHeight: 500, overflowY: 'auto' }}>
            {questions.length === 0 ? (
              <div className="empty-state"><p>No questions found for this subject. Run the seed script.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {questions.map((q) => {
                  const isSelected = selectedQuestions[activeSubject][activeSection].includes(q._id);
                  return (
                    <div key={q._id} onClick={() => toggleQuestion(q._id)} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                      padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
                      background: isSelected ? 'var(--accent-blue-light)' : 'var(--bg-tertiary)',
                      cursor: 'pointer', transition: 'all var(--transition-fast)',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4,
                        border: `2px solid ${isSelected ? 'var(--accent-blue)' : 'var(--text-muted)'}`,
                        background: isSelected ? 'var(--accent-blue)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isSelected && <HiOutlineCheck size={12} color="white" />}
                      </div>
                      <div style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                        {q.questionText.substring(0, 120)}...
                      </div>
                      <span className="badge" style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)', fontSize: '0.65rem' }}>
                        {q.chapter}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-xl)' }}>
            <button className="btn btn-secondary" onClick={() => setStep(0)}>
              <HiOutlineChevronLeft size={16} /> Back
            </button>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', alignSelf: 'center' }}>
              Total: {getTotalSelected()}/200 questions
            </div>
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={getTotalSelected() === 0}>
              Next <HiOutlineChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Assign */}
      {step === 2 && (
        <motion.div className="glass-card" style={{ padding: 'var(--space-xl)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Assign to Batches</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
            {batches.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No batches created yet.</p>
            ) : (
              batches.map((b) => {
                const isSelected = assignedBatches.includes(b._id);
                return (
                  <button key={b._id} onClick={() => {
                    setAssignedBatches(isSelected
                      ? assignedBatches.filter((id) => id !== b._id)
                      : [...assignedBatches, b._id]
                    );
                  }} style={{
                    padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
                    background: isSelected ? 'var(--accent-blue-light)' : 'var(--bg-tertiary)',
                    color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)',
                  }}>
                    {isSelected && <HiOutlineCheck size={14} style={{ marginRight: 4 }} />}
                    {b.name}
                  </button>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-xl)' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <HiOutlineChevronLeft size={16} /> Back
            </button>
            <button className="btn btn-success" onClick={handlePublish}
              disabled={loading || (assignedBatches.length === 0 && assignedStudents.length === 0)}>
              {loading ? 'Publishing...' : 'Publish Test 🚀'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Success */}
      {step === 3 && createdTest && (
        <motion.div
          className="glass-card"
          style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-emerald-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-lg)',
          }}>
            <HiOutlineCheck size={36} color="var(--accent-emerald)" />
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-sm)' }}>Test Published!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
            Share the exam code below with your students
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-md)',
            padding: '1rem 2rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-secondary)',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)',
              fontWeight: 800, letterSpacing: '0.3em', color: 'var(--accent-blue)',
            }}>
              {createdTest.examCode}
            </span>
            <button className="btn btn-ghost" onClick={copyExamCode} title="Copy code">
              <HiOutlineClipboard size={20} />
              {copiedCode ? 'Copied!' : ''}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 'var(--space-2xl)' }}>
            <button className="btn btn-primary" onClick={() => navigate(`/teacher/tests/${createdTest._id}/monitor`)}>
              Open Live Monitor
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/teacher/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
