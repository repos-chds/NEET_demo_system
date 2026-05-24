import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlusCircle, HiOutlineClipboard, HiOutlineTrash,
  HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineUsers,
} from 'react-icons/hi2';
import api from '../../services/api';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', batchId: '' });
  const [newBatch, setNewBatch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [search, filterBatch]);

  const loadData = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterBatch) params.batchId = filterBatch;

      const [studentsRes, batchesRes] = await Promise.all([
        api.get('/students', { params }),
        api.get('/batches'),
      ]);

      setStudents(studentsRes.data.data.students || []);
      setBatches(batchesRes.data.data.batches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/students', newStudent);
      setShowAddModal(false);
      setNewStudent({ name: '', batchId: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/batches', { name: newBatch });
      setShowBatchModal(false);
      setNewBatch('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create batch');
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!confirm('Delete this batch?')) return;
    await api.delete(`/batches/${id}`);
    loadData();
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this student?')) return;
    await api.delete(`/students/${id}`);
    loadData();
  };

  const copyCredentials = (student) => {
    const text = `Username: ${student.username}\nPassword: ${student.plainPassword}`;
    navigator.clipboard.writeText(text);
    setCopiedId(student._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage your students and batches</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary" onClick={() => setShowBatchModal(true)}>
            <HiOutlinePlusCircle size={16} />
            New Batch
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <HiOutlinePlusCircle size={16} />
            Add Student
          </button>
        </div>
      </div>

      {/* Batches row */}
      {batches.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}
        >
          <button
            className={`badge ${!filterBatch ? 'badge-blue' : ''}`}
            style={{ cursor: 'pointer', padding: '0.375rem 0.875rem', fontSize: 'var(--text-sm)', border: 'none' }}
            onClick={() => setFilterBatch('')}
          >
            All ({students.length})
          </button>
          {batches.map((batch) => (
            <div key={batch._id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                className={`badge ${filterBatch === batch._id ? 'badge-blue' : ''}`}
                style={{ cursor: 'pointer', padding: '0.375rem 0.875rem', fontSize: 'var(--text-sm)', border: 'none' }}
                onClick={() => setFilterBatch(batch._id)}
              >
                {batch.name} ({batch.studentCount || 0})
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteBatch(batch._id)} title="Delete batch">
                <HiOutlineTrash size={12} />
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-lg)', maxWidth: 400 }}>
        <HiOutlineMagnifyingGlass
          size={18}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="spinner-container"><div className="spinner" /></div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <HiOutlineUsers size={48} />
          <h3>No students yet</h3>
          <p>Add your first student to get started</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Password</th>
                <th>Batch</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-blue)' }}>{s.username}</code></td>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{s.plainPassword}</code></td>
                  <td>{s.batch?.name || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => copyCredentials(s)}
                        title="Copy credentials"
                      >
                        <HiOutlineClipboard size={14} />
                        {copiedId === s._id ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeactivate(s._id)}
                        title="Deactivate"
                        style={{ color: 'var(--accent-rose)' }}
                      >
                        <HiOutlineTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="modal-header">
                <h3 className="modal-title">Add Student</h3>
                <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}><HiOutlineXMark size={20} /></button>
              </div>
              <form onSubmit={handleAddStudent}>
                <div className="modal-body">
                  {error && <div className="login-error">{error}</div>}
                  <div className="form-group">
                    <label className="form-label">Student Name</label>
                    <input className="form-input" placeholder="Full name" value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} required autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch (optional)</label>
                    <select className="form-select" value={newStudent.batchId}
                      onChange={(e) => setNewStudent({ ...newStudent, batchId: e.target.value })}>
                      <option value="">No batch</option>
                      {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    A username and password will be auto-generated for this student.
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Student</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Batch Modal */}
      <AnimatePresence>
        {showBatchModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowBatchModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="modal-header">
                <h3 className="modal-title">Create Batch</h3>
                <button className="btn btn-ghost" onClick={() => setShowBatchModal(false)}><HiOutlineXMark size={20} /></button>
              </div>
              <form onSubmit={handleAddBatch}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Batch Name</label>
                    <input className="form-input" placeholder="e.g. NEET 2026 — Batch A" value={newBatch}
                      onChange={(e) => setNewBatch(e.target.value)} required autoFocus />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowBatchModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Batch</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
