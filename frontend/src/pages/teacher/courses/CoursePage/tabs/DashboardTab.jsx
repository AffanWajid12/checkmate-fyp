import { useCourseAnnouncements } from '../../../../../hooks/useCourses';

const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
            <p className="text-xs text-text-secondary mt-1">{label}</p>
        </div>
    </div>
);

const StudentsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const MegaphoneIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
);

const ClipboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
);

const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const DashboardTab = ({ course, courseId }) => {
    const students = course?.students?.map((e) => e.student) ?? [];
    const { data: announcements = [] } = useCourseAnnouncements(courseId);

    // Flatten assessments from all announcements
    const allAssessments = [];
    announcements.forEach((ann) => {
        (ann.assessments ?? []).forEach((a) => allAssessments.push(a));
    });

    const recentAnnouncements = announcements.slice(0, 3);

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Students Enrolled"
                    value={students.length}
                    icon={<StudentsIcon />}
                    color="bg-accent-50 text-accent-500"
                />
                <StatCard
                    label="Announcements"
                    value={announcements.length}
                    icon={<MegaphoneIcon />}
                    color="bg-blue-50 text-blue-500"
                />
                <StatCard
                    label="Assessments"
                    value={allAssessments.length}
                    icon={<ClipboardIcon />}
                    color="bg-purple-50 text-purple-500"
                />
                <StatCard
                    label="Course Code"
                    value={course?.code ?? '—'}
                    icon={<CalendarIcon />}
                    color="bg-amber-50 text-amber-500"
                />
            </div>

            {/* Recent Announcements */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100">
                    <h3 className="text-sm font-bold text-text-primary">Recent Announcements</h3>
                </div>
                {recentAnnouncements.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <p className="text-sm text-text-muted">No announcements yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {recentAnnouncements.map((ann) => (
                            <div key={ann.id} className="px-5 py-3.5 flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-text-primary truncate">{ann.title}</p>
                                    <p className="text-xs text-text-muted mt-0.5">
                                        {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                {ann.assessments?.length > 0 && (
                                    <span className="text-xs font-semibold text-accent-500 bg-accent-50 px-2.5 py-1 rounded-full flex-shrink-0">
                                        {ann.assessments.length} assessment{ann.assessments.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Students */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100">
                    <h3 className="text-sm font-bold text-text-primary">Enrolled Students</h3>
                    <p className="text-xs text-text-muted mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''}</p>
                </div>
                {students.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <p className="text-sm text-text-muted">No students enrolled yet. Share the course code!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {students.slice(0, 5).map((s) => (
                            <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-accent-600">
                                        {s.name?.charAt(0).toUpperCase() ?? '?'}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate">{s.name}</p>
                                    <p className="text-xs text-text-muted truncate">{s.email}</p>
                                </div>
                            </div>
                        ))}
                        {students.length > 5 && (
                            <div className="px-5 py-3 text-center">
                                <p className="text-xs text-text-muted">+{students.length - 5} more student{students.length - 5 !== 1 ? 's' : ''}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardTab;
