import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useLogout, useMe } from '../../hooks/useAuth';
import supabase from '../../utils/supabaseClient';
import logo from '../../logo.png';

// ── Sidebar nav items ──────────────────────────────────────────
const navItems = [
    {
        to: '/student/dashboard',
        label: 'Dashboard',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
    {
        to: '/student/courses',
        label: 'My Courses',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
        ),
    },
    {
        to: '/student/attendance',
        label: 'Attendance',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M9 16l2 2 4-4" />
            </svg>
        ),
    },
    {
        to: '/student/assignments',
        label: 'Assignments',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
];

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
);

const StudentSidebar = ({ children }) => {
    const { mutateAsync: logout, isPending: loading } = useLogout();
    const { data: user } = useMe();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const handleNavClick = () => {
        setSidebarOpen(false);
    };

    const sidebarContent = (
        <>
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-5 py-5 border-b border-neutral-100">
                <div className="bg-primary p-1.5 rounded-lg flex-shrink-0">
                    <img src={logo} alt="Checkmate Logo" className="h-7 w-auto" />
                </div>
                <span className="text-lg font-bold text-text-primary tracking-tight">Checkmate</span>
            </div>

            {/* Role badge */}
            <div className="px-5 pt-4 pb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-accent-500">
                    Student Portal
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/student/dashboard'}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? 'bg-accent-50 text-accent-500'
                                : 'text-text-secondary hover:bg-neutral-100 hover:text-text-primary'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className={isActive ? 'text-accent-500' : 'text-neutral-500'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Student Profile Footer */}
            <div className="border-t border-neutral-100 px-4 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-neutral-200">
                    {user?.profile_picture && user.profile_picture.trim() !== "" ? (
                        <img 
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profiles/${user.profile_picture}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <span className={user?.profile_picture ? 'hidden' : 'flex'}>
                        {(user?.name?.charAt(0) || '?').toUpperCase()}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                        {user?.name || 'Loading…'}
                    </p>
                    <p className="text-xs text-text-muted leading-tight truncate">{user?.email}</p>
                </div>
                <Link to="/student/settings" title="Settings" className="text-text-muted hover:text-text-primary hover:bg-neutral-100 p-1.5 rounded-lg transition-colors flex-shrink-0">
                    <SettingsIcon />
                </Link>
            </div>
            <div className="px-6 py-5 border-t border-neutral-100">
                <button className="flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors w-full"
                    onClick={() => logout().then(() => navigate('/login'))}
                    disabled={loading}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-text-muted">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log out
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-background-secondary overflow-hidden">
            {/* ── Desktop Sidebar ──────────────────────────── */}
            <aside className="hidden md:flex w-64 bg-background border-r border-neutral-200 flex-col flex-shrink-0 h-full">
                {sidebarContent}
            </aside>

            {/* ── Mobile: backdrop ────────────────────────── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden cursor-pointer"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Mobile: slide-in drawer ──────────────────── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-neutral-200 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-neutral-100 transition-colors"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
                {sidebarContent}
            </aside>

            {/* ── Right side ──────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Mobile top bar */}
                <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-background border-b border-neutral-200 flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition-colors"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-1 rounded-md flex-shrink-0">
                            <img src={logo} alt="Checkmate Logo" className="h-5 w-auto" />
                        </div>
                        <span className="text-base font-bold text-text-primary tracking-tight">Checkmate</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default StudentSidebar;
