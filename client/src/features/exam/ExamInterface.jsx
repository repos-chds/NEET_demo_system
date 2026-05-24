import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineFlag, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineXMark } from 'react-icons/hi2';
import api from '../../services/api';

const SUBJECTS = ['Physics', 'Chemistry', 'Botany', 'Zoology'];

export default function ExamInterface() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [activeSection, setActiveSection] = useState('sectionA');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [reviewFlags, setReviewFlags] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const timerRef = useRef(null);

  // Load attempt
  useEffect(() => {
    loadAttempt();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      const res = await api.get(`/attempts/${attemptId}`);
      const data = res.data.data.attempt;
      setAttempt(data);

      // Restore answers from server
      // Mongoose Map serializes as a plain object in JSON
      const restoredAnswers = {};
      const restoredFlags = {};

      if (data.answers && typeof data.answers === 'object') {
        const entries = Object.entries(data.answers);
        for (const [key, val] of entries) {
          if (val?.selectedOption) {
            restoredAnswers[key] = val.selectedOption;
          }
          if (val?.markedForReview) {
            restoredFlags[key] = true;
          }
        }
      }

      setAnswers(restoredAnswers);
      setReviewFlags(restoredFlags);

      // Calculate time remaining
      const startTime = new Date(data.startedAt).getTime();
      const durationMs = (data.test?.duration || 200) * 60 * 1000;
      const endTime = startTime + durationMs;
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Start timer
      if (remaining > 0) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleAutoSubmit();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to load attempt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      await api.post(`/attempts/${attemptId}/submit`);
      navigate(`/student/result/${attemptId}`, { replace: true });
    } catch (err) {
      console.error('Auto-submit failed:', err);
    }
  };

  // Get current questions list for active subject/section
  const getQuestions = useCallback(() => {
    if (!attempt?.test?.sections) return [];
    const section = attempt.test.sections[activeSubject];
    if (!section) return [];
    return section[activeSection] || [];
  }, [attempt, activeSubject, activeSection]);

  const questions = getQuestions();
  const currentQ = questions[currentQIndex];

  // Save answer
  const selectOption = async (option) => {
    if (!currentQ) return;
    const qId = currentQ._id;
    const prevOption = answers[qId];

    // If same option clicked, deselect (clear response)
    const newOption = prevOption === option ? null : option;

    setAnswers((prev) => {
      if (newOption === null) {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      }
      return { ...prev, [qId]: newOption };
    });

    // Save to server
    try {
      await api.put(`/attempts/${attemptId}/answer`, {
        questionId: qId,
        selectedOption: newOption,
        markedForReview: reviewFlags[qId] || false,
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const clearResponse = async () => {
    if (!currentQ) return;
    const qId = currentQ._id;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });

    try {
      await api.put(`/attempts/${attemptId}/answer`, {
        questionId: qId,
        selectedOption: null,
        markedForReview: reviewFlags[qId] || false,
      });
    } catch (err) {
      console.error('Failed to clear answer:', err);
    }
  };

  const toggleReview = async () => {
    if (!currentQ) return;
    const qId = currentQ._id;
    const newFlag = !reviewFlags[qId];
    setReviewFlags((prev) => ({ ...prev, [qId]: newFlag }));

    try {
      await api.put(`/attempts/${attemptId}/answer`, {
        questionId: qId,
        selectedOption: answers[qId] || null,
        markedForReview: newFlag,
      });
    } catch (err) {
      console.error('Failed to toggle review:', err);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await api.post(`/attempts/${attemptId}/submit`);
      navigate(`/student/result/${attemptId}`, { replace: true });
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Get questions for palette (current subject + section)
  const paletteQuestions = getQuestions();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="empty-state">
          <h3>Attempt not found</h3>
          <p>Please go back and try again.</p>
        </div>
      </div>
    );
  }

  const timerClass = timeLeft <= 300 ? 'danger' : timeLeft <= 900 ? 'warning' : '';

  return (
    <div className="exam-layout">
      {/* Header */}
      <div className="exam-header" style={{ position: 'fixed', top: 0, left: 0, right: 320, zIndex: 10 }}>
        <div className="exam-title">{attempt?.test?.name || 'Mock Test'}</div>
        <div className="exam-subject-tabs">
          {SUBJECTS.map((subj) => (
            <button
              key={subj}
              className={`exam-subject-tab ${activeSubject === subj ? 'active' : ''}`}
              onClick={() => { setActiveSubject(subj); setActiveSection('sectionA'); setCurrentQIndex(0); }}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="exam-main" style={{ paddingTop: 'calc(var(--topbar-height) + var(--space-xl))' }}>
        {/* Section toggle */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <button className={`btn ${activeSection === 'sectionA' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => { setActiveSection('sectionA'); setCurrentQIndex(0); }}>
            Section A (Mandatory)
          </button>
          <button className={`btn ${activeSection === 'sectionB' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => { setActiveSection('sectionB'); setCurrentQIndex(0); }}>
            Section B (Choose 10)
          </button>
        </div>

        {/* Question display */}
        {currentQ ? (
          <motion.div key={currentQ._id} className="question-card" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="question-number">
                {activeSubject} • {activeSection === 'sectionA' ? 'Section A' : 'Section B'} • Q{currentQIndex + 1} of {questions.length}
              </div>
              <button
                className={`btn btn-sm ${reviewFlags[currentQ._id] ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleReview}
                style={reviewFlags[currentQ._id] ? { background: 'var(--accent-amber)', borderColor: 'var(--accent-amber)' } : undefined}
              >
                <HiOutlineFlag size={14} />
                {reviewFlags[currentQ._id] ? 'Marked for Review' : 'Mark for Review'}
              </button>
            </div>

            <div className="question-text">{currentQ.questionText}</div>

            <div className="option-list">
              {['A', 'B', 'C', 'D'].map((opt) => (
                <div
                  key={opt}
                  className={`option-item ${answers[currentQ._id] === opt ? 'selected' : ''}`}
                  onClick={() => selectOption(opt)}
                >
                  <span className="option-label">{opt}</span>
                  <span className="option-text">{currentQ[`option${opt}`]}</span>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-xl)' }}>
              <button className="btn btn-secondary" disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => prev - 1)}>
                <HiOutlineChevronLeft size={16} /> Previous
              </button>
              {answers[currentQ._id] && (
                <button className="btn btn-ghost btn-sm" onClick={clearResponse}>
                  Clear Response
                </button>
              )}
              <button className="btn btn-primary" disabled={currentQIndex >= questions.length - 1}
                onClick={() => setCurrentQIndex((prev) => prev + 1)}>
                Next <HiOutlineChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="empty-state">
            <h3>No questions in this section</h3>
            <p>Try switching to another subject or section.</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="exam-sidebar">
        {/* Timer */}
        <div className="exam-timer">
          <div className="exam-timer-label">Time Remaining</div>
          <div className={`exam-timer-value ${timerClass}`}>{formatTime(timeLeft)}</div>
        </div>

        {/* Question palette */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Question Palette
        </div>
        <div className="question-palette">
          <div className="palette-grid">
            {paletteQuestions.map((q, i) => {
              let cls = '';
              if (i === currentQIndex) cls = 'current';
              else if (answers[q._id]) cls = 'answered';
              else if (reviewFlags[q._id]) cls = 'review';

              return (
                <button
                  key={q._id}
                  className={`palette-btn ${cls}`}
                  onClick={() => setCurrentQIndex(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          {[
            { cls: 'current', label: 'Current' },
            { cls: 'answered', label: 'Answered' },
            { cls: 'review', label: 'Review' },
            { cls: '', label: 'Not Visited' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              <div className={`palette-btn ${item.cls}`} style={{ width: 16, height: 16, fontSize: 8, aspectRatio: 'unset' }} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Submit button */}
        <button
          className="btn btn-success btn-lg"
          style={{ width: '100%' }}
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Test'}
        </button>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowConfirm(false)}>
          <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="modal-header">
              <h3 className="modal-title">Submit Test?</h3>
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}><HiOutlineXMark size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                Are you sure you want to submit? You cannot change your answers after submission.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'var(--accent-emerald-light)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {Object.keys(answers).length}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Answered</div>
                </div>
                <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'var(--accent-amber-light)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--accent-amber)' }}>
                    {Object.keys(reviewFlags).filter((k) => reviewFlags[k]).length}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>For Review</div>
                </div>
                <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {formatTime(timeLeft)}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Remaining</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Go Back</button>
              <button className="btn btn-success" onClick={handleSubmit}>
                Confirm Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
