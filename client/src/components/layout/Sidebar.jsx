import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentList,
  HiOutlineChartBarSquare,
  HiOutlineTv,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';

const teacherLinks = [
  { to: '/teacher/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
  { to: '/teacher/students', icon: HiOutlineUsers, label: 'Students' },
  { to: '/teacher/question-bank', icon: HiOutlineBookOpen, label: 'Question Bank' },
  { to: '/teacher/tests/create', icon: HiOutlineClipboardDocumentList, label: 'Create Test' },
];

const studentLinks = [
  { to: '/student/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'teacher' ? teacherLinks : studentLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">NEET Hub</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Menu</div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <link.icon />
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user?.name)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
        <button className="sidebar-link" onClick={handleLogout} style={{ marginTop: '0.5rem' }}>
          <HiOutlineArrowRightOnRectangle />
          Logout
        </button>
      </div>
    </aside>
  );
}
