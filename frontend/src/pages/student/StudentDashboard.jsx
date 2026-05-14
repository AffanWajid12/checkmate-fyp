import { useState, useEffect } from 'react';
import CoursesPage from './courses/CoursesPage';
import AttendanceOverview from './attendance/AttendanceOverview';
import StudentSidebar from './StudentSidebar';
import StudentAssignmentsOverview from './assignments/AssignmentsOverview';
import MarksPage from './marks/MarksPage';

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

// ── Main StudentDashboard component ───────────────────────────
const StudentDashboard = ({ defaultTab = 'courses' }) => {
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Sync state with prop if it changes via navigation
    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'courses':
                return <CoursesPage />;
            case 'attendance':
                return <AttendanceOverview />;
            case 'assignments':
                return <StudentAssignmentsOverview />;
            case 'marks':
                return <MarksPage />;
            default:
                return <CoursesPage />;
        }
    };

    return (
        <StudentSidebar>
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                {/* Internal Tab Navigation for Dashboard if needed, 
                    OR we just default to Courses for the Dashboard root */}
                {renderContent()}
            </div>
        </StudentSidebar>
    );
};

export default StudentDashboard;
