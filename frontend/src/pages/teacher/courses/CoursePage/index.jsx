// ─── Main Component ───────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import supabase from '../../../../utils/supabaseClient';
import { useTeacherCourses } from '../../../../hooks/useCourses';
import { BackIcon, CopyIcon } from './components/Icons';
import TeacherSidebar from '../../TeacherSidebar';

import DashboardTab from './tabs/DashboardTab';
import StudentsTab from './tabs/StudentsTab';
import AnnouncementsTab from './tabs/AnnouncementsTab';
import AssessmentsTab from './tabs/AssessmentsTab';
import AttendanceTab from './tabs/AttendanceTab';

// ─── Tab Icons ────────────────────────────────────────────────────────────────

const DashboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
);

const StudentsTabIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const AnnouncementsTabIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
);

const AssessmentsTabIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

const AttendanceTabIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M9 16l2 2 4-4" />
    </svg>
);

const BookIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-accent-500">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
);

const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { key: 'students', label: 'Students', icon: <StudentsTabIcon /> },
    { key: 'announcements', label: 'Announcements', icon: <AnnouncementsTabIcon /> },
    { key: 'assessments', label: 'Assessments', icon: <AssessmentsTabIcon /> },
    { key: 'attendance', label: 'Attendance', icon: <AttendanceTabIcon /> },
];

// ─── Teacher Name Hook ────────────────────────────────────────────────────────

const useTeacherName = () => {
    const [name, setName] = useState('');
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                const meta = session.user.user_metadata;
                setName(meta?.name ?? meta?.full_name ?? session.user.email?.split('@')[0] ?? '');
            }
        });
    }, []);
    return name;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherCoursePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(initialTab || 'dashboard');

    useEffect(() => {
        if (initialTab && initialTab !== activeTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const { data: courses = [] } = useTeacherCourses();
    const course = courses.find((c) => c.id === courseId);
    const studentCount = course?.students?.length ?? 0;
    const teacherName = useTeacherName();

    const handleCopyCode = () => {
        if (!course?.code) return;
        navigator.clipboard.writeText(course.code).then(() => toast.success('Code copied!'));
    };

    return (
        <TeacherSidebar>
            <div className="max-w-6xl mx-auto pb-16 p-6">

                {/* Back */}
                <button
                    onClick={() => navigate('/teacher/dashboard')}
                    className="flex items-center bg-black p-2 text-sm rounded-xl text-white font-bold gap-1.5 transition-colors mb-4 cursor-pointer"
                >
                    <BackIcon />
                    Back to Courses
                </button>

                {/* ── Course Header Card ─────────────────────────── */}
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mb-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        {/* Left side */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <BookIcon />
                            </div>
                            <div>
                                {/* Code + Section */}
                                <div className="flex items-center gap-2 mb-1">
                                    <button
                                        onClick={handleCopyCode}
                                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-accent-500 bg-accent-50 border border-accent-100 px-2 py-0.5 rounded-full hover:bg-accent-100 transition-colors cursor-pointer"
                                    >
                                        {course?.code ?? '—'}
                                        <CopyIcon />
                                    </button>
                                    {course?.section && (
                                        <span className="text-xs text-text-muted">Section {course.section}</span>
                                    )}
                                </div>

                                {/* Title */}
                                <h1 className="text-xl font-bold text-text-primary leading-snug">
                                    {course?.title ?? 'Course'}
                                </h1>

                                {/* Meta row */}
                                <div className="flex items-center gap-4 mt-1.5 text-xs text-text-secondary flex-wrap">
                                    {teacherName && (
                                        <span className="flex items-center gap-1">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            {teacherName}
                                        </span>
                                    )}
                                    {course?.semester && (
                                        <span className="flex items-center gap-1">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            {course.semester}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                        </svg>
                                        {studentCount} student{studentCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Tab Bar ────────────────────────────────────── */}
                <div className="mt-5 border-b border-neutral-200 bg-white rounded-b-none -mt-px shadow-sm">
                    <nav className="flex overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.key
                                    ? 'border-accent-500 text-accent-500'
                                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-neutral-300'
                                    }`}
                            >
                                <span className={activeTab === tab.key ? 'text-accent-500' : 'text-text-muted'}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* ── Tab Content ────────────────────────────────── */}
                <div className="mt-6">
                    {activeTab === 'dashboard' && <DashboardTab course={course} courseId={courseId} />}
                    {activeTab === 'students' && <StudentsTab course={course} />}
                    {activeTab === 'announcements' && <AnnouncementsTab courseId={courseId} />}
                    {activeTab === 'assessments' && <AssessmentsTab courseId={courseId} />}
                    {activeTab === 'attendance' && <AttendanceTab course={course} courseId={courseId} />}
                </div>
            </div>
        </TeacherSidebar>
    );
};

export default TeacherCoursePage;
