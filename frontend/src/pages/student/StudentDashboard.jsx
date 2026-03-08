import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../logo.png';
import CoursesPage from './courses/CoursesPage';
import AttendanceOverview from './attendance/AttendanceOverview';
import supabase from '../../utils/supabaseClient';

import { useLogout } from '../../hooks/useAuth';

// ── Sidebar nav items ──────────────────────────────────────────
const navItems = [
    {
        id: 'courses',
        label: 'Courses',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
        ),
    },
    {
        id: 'attendance',
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
        id: 'assignments',
        label: 'Assignments',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        ),
    },
    {
        id: 'grades',
        label: 'Grades',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
];

// ── Placeholder pages for other tabs ──────────────────────────
const PlaceholderPage = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-50 border border-accent-100 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-accent-400">
                <path d="M12 3v1m0 16v1M4.22 4.22l.7.7m13.86 13.86l.7.7M1 12h1m20 0h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7" />
            </svg>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
        <p className="text-text-secondary text-sm">This section is coming soon.</p>
    </div>
);

// ── Settings icon ──────────────────────────────────────────────
const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
);

// ── Main StudentDashboard component ───────────────────────────
const StudentDashboard = () => {
    const [activeTab, setActiveTab] = useState('courses');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState({ name: '', email: '' });
    const { mutateAsync: logout, isPending: loading, error } = useLogout();
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                const meta = session.user.user_metadata;
                setUser({
                    name: meta?.name ?? meta?.full_name ?? session.user.email?.split('@')[0] ?? 'Student',
                    email: session.user.email ?? '',
                });
            }
        });
    }, []);

    const renderContent = () => {
        switch (activeTab) {            case 'courses':
                return <CoursesPage />;
            case 'attendance':
                return <AttendanceOverview />;
            case 'assignments':
                return <PlaceholderPage title="Assignments" />;
            case 'grades':
                return <PlaceholderPage title="Grades" />;
            default:
                return <CoursesPage />;
        }
    };    return (
        <div className="flex h-screen bg-background-secondary overflow-hidden">

            {/* ── Desktop Sidebar — hidden on mobile ──────────── */}
            <aside className="hidden md:flex w-64 bg-background border-r border-neutral-200 flex-col flex-shrink-0 h-full">

                {/* Brand */}
                <div className="flex items-center gap-2.5 px-5 py-5 border-b border-neutral-100">
                    <div className="bg-primary p-1.5 rounded-lg flex-shrink-0">
                        <img src={logo} alt="Checkmate Logo" className="h-7 w-auto" />
                    </div>
                    <span className="text-lg font-bold text-text-primary tracking-tight">Checkmate</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-accent-50 text-accent-500 border border-accent-100'
                                        : 'text-text-secondary hover:bg-neutral-100 hover:text-text-primary'
                                }`}
                            >
                                <span className={isActive ? 'text-accent-500' : 'text-neutral-500'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>                {/* Student Profile Footer */}
                <div className="border-t border-neutral-100 px-4 py-4 flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-orange-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                        {(user.name.charAt(0) || '?').toUpperCase()}
                    </div>

                    {/* Name & Email */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                            {user.name || 'Loading…'}
                        </p>
                        <p className="text-xs text-text-muted leading-tight truncate">{user.email}</p>
                    </div>

                    {/* Settings */}
                    <button
                        title="Settings"
                        className="text-text-muted hover:text-text-primary hover:bg-neutral-100 p-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                        <SettingsIcon />
                    </button>
                </div>
                <div className="px-6 py-5 border-t border-neutral-100">
                    <button className="flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors w-full"
                        onClick={logout}
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
            </aside>

            {/* ── Mobile: backdrop ────────────────────────────── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Mobile: slide-in drawer ──────────────────────── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-neutral-200 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Close button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-neutral-100 transition-colors"
                    title="Close menu"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* Brand */}
                <div className="flex items-center gap-2.5 px-5 py-5 border-b border-neutral-100">
                    <div className="bg-primary p-1.5 rounded-lg flex-shrink-0">
                        <img src={logo} alt="Checkmate Logo" className="h-7 w-auto" />
                    </div>
                    <span className="text-lg font-bold text-text-primary tracking-tight">Checkmate</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-accent-50 text-accent-500 border border-accent-100'
                                        : 'text-text-secondary hover:bg-neutral-100 hover:text-text-primary'
                                }`}
                            >
                                <span className={isActive ? 'text-accent-500' : 'text-neutral-500'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>                {/* Student Profile Footer */}
                <div className="border-t border-neutral-100 px-4 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                        {(user.name.charAt(0) || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary leading-tight truncate">{user.name || 'Loading…'}</p>
                        <p className="text-xs text-text-muted leading-tight truncate">{user.email}</p>
                    </div>
                    <button title="Settings" className="text-text-muted hover:text-text-primary hover:bg-neutral-100 p-1.5 rounded-lg transition-colors flex-shrink-0">
                        <SettingsIcon />
                    </button>
                </div>
            </aside>

            {/* ── Right side: top bar (mobile) + content ──────── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* Mobile top bar with hamburger */}
                <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-background border-b border-neutral-200 flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition-colors"
                        title="Open menu"
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
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentDashboard;
