import { useCourseAnnouncements, useStudentAttendance } from '../../../../hooks/useCourses';

const StatCard = ({ label, value, icon, color, subtext }) => (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
            <p className="text-xs text-text-secondary mt-1">{label}</p>
            {subtext && <p className="text-[10px] text-text-muted mt-0.5">{subtext}</p>}
        </div>
    </div>
);

const CalendarCheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M9 16l2 2 4-4" />
    </svg>
);

const ClipboardIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
);

const MegaphoneIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
);

const DashboardTab = ({ course, courseId }) => {
    const { data: records = [] } = useStudentAttendance(courseId);
    const { data: announcements = [] } = useCourseAnnouncements(courseId);

    // Attendance Rate
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : null;

    // Pending Assessments
    const allAssessments = [];
    announcements.forEach((ann) => {
        (ann.assessments ?? []).forEach((a) => allAssessments.push(a));
    });
    const pendingAssessments = allAssessments.filter(a => !a.due_date || new Date(a.due_date) > new Date());

    const recentAnnouncements = announcements.slice(0, 3);

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label="Attendance Rate"
                    value={rate !== null ? `${rate}%` : 'N/A'}
                    icon={<CalendarCheckIcon />}
                    color={rate === null ? "bg-neutral-50 text-neutral-400" : rate >= 75 ? "bg-success-light text-success" : "bg-red-50 text-red-500"}
                    subtext={total > 0 ? `${present} / ${total} sessions` : 'No records yet'}
                />
                <StatCard
                    label="Assessments"
                    value={pendingAssessments.length}
                    icon={<ClipboardIcon />}
                    color="bg-purple-50 text-purple-500"
                    subtext="Available / Upcoming"
                />
                <StatCard
                    label="Announcements"
                    value={announcements.length}
                    icon={<MegaphoneIcon />}
                    color="bg-blue-50 text-blue-500"
                    subtext="Total posts"
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

            {/* Course Information Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-text-primary mb-3">Course Information</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">Instructor</span>
                        <span className="font-semibold text-text-primary">{course?.teacher?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary">Course Code</span>
                        <span className="font-mono font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded">{course?.code ?? '—'}</span>
                    </div>
                    {course?.semester && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary">Semester</span>
                            <span className="font-semibold text-text-primary">{course.semester}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
