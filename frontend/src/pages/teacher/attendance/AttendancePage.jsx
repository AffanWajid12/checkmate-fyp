import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTeacherCourses, useMarkAttendance, useCourseAttendance } from '../../../hooks/useCourses';

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

// ─── Status config ────────────────────────────────────────────────────────────

const STATUSES = ['PRESENT', 'ABSENT', 'LATE'];

const STATUS_CONFIG = {
    PRESENT: { label: 'Present', active: 'bg-success text-white border-success',   idle: 'border-neutral-200 text-text-secondary hover:border-success hover:text-success' },
    ABSENT:  { label: 'Absent',  active: 'bg-red-500 text-white border-red-500',   idle: 'border-neutral-200 text-text-secondary hover:border-red-400 hover:text-red-500' },
    LATE:    { label: 'Late',    active: 'bg-amber-500 text-white border-amber-500', idle: 'border-neutral-200 text-text-secondary hover:border-amber-400 hover:text-amber-600' },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().slice(0, 10);

// ─── Student Row ──────────────────────────────────────────────────────────────

const StudentRow = ({ student, status, onStatusChange }) => (
    <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-text-secondary flex-shrink-0">
                {student.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
                <p className="text-sm font-semibold text-text-primary">{student.name}</p>
                <p className="text-xs text-text-muted">{student.email}</p>
            </div>
        </div>
        <div className="flex items-center gap-1.5">
            {STATUSES.map((s) => {
                const cfg = STATUS_CONFIG[s];
                const isActive = status === s;
                return (
                    <button
                        key={s}
                        onClick={() => onStatusChange(student.id, s)}
                        className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                            isActive ? cfg.active : cfg.idle
                        }`}
                    >
                        {cfg.label}
                    </button>
                );
            })}
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherAttendancePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [date, setDate] = useState(todayISO());
    const [statuses, setStatuses] = useState({}); // { studentId: 'PRESENT' | 'ABSENT' | 'LATE' }
    const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'history'

    const { data: courses = [] } = useTeacherCourses();
    const course = courses.find((c) => c.id === courseId);
    const students = course?.students?.map((e) => e.student) ?? [];

    const { mutate: markAttendance, isPending } = useMarkAttendance(courseId);
    const { data: historyRecords = [], isLoading: historyLoading } = useCourseAttendance(courseId);

    const handleStatusChange = (studentId, status) => {
        setStatuses((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleMarkAll = (status) => {
        const all = {};
        students.forEach((s) => { all[s.id] = status; });
        setStatuses(all);
    };

    const handleSubmit = () => {
        const records = students.map((s) => ({
            student_id: s.id,
            status: statuses[s.id] ?? 'ABSENT',
        }));

        markAttendance(
            { date, records },
            {
                onSuccess: () => {
                    toast.success(`Attendance saved for ${date}`);
                },
                onError: () => {
                    toast.error('Failed to save attendance. Please try again.');
                },
            }
        );
    };

    // ── History helpers ───────────────────────────────────────────
    // Group history records by date for the history tab
    const byDate = historyRecords.reduce((acc, r) => {
        const d = r.date.slice(0, 10);
        if (!acc[d]) acc[d] = [];
        acc[d].push(r);
        return acc;
    }, {});
    const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

    const STATUS_PILL = {
        PRESENT: 'bg-success-light text-success border-green-200',
        ABSENT:  'bg-red-50 text-red-500 border-red-200',
        LATE:    'bg-amber-50 text-amber-600 border-amber-200',
    };

    const markedCount = Object.keys(statuses).length;
    const allMarked = students.length > 0 && markedCount === students.length;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back + Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
                >
                    <BackIcon />
                    Back to Course
                </button>
                <h1 className="text-2xl font-bold text-text-primary">Attendance</h1>
                {course && (
                    <p className="text-sm text-text-secondary mt-0.5">
                        {course.title} · {course.code}
                    </p>
                )}
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: 'mark', label: 'Mark Attendance' },
                    { key: 'history', label: 'History' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            activeTab === key
                                ? 'bg-primary text-text-inverse border-primary'
                                : 'border-neutral-200 text-text-secondary hover:bg-neutral-50'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Mark Attendance tab ─────────────────────────── */}
            {activeTab === 'mark' && (
                <>
                    {/* Date picker + quick actions */}
                    <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-text-muted mb-1.5">Session Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex gap-2 sm:self-end">
                            <button
                                onClick={() => handleMarkAll('PRESENT')}
                                className="px-3 py-2.5 rounded-xl border border-green-200 text-success bg-success-light text-xs font-semibold hover:bg-green-100 transition-colors"
                            >
                                All Present
                            </button>
                            <button
                                onClick={() => handleMarkAll('ABSENT')}
                                className="px-3 py-2.5 rounded-xl border border-red-200 text-red-500 bg-red-50 text-xs font-semibold hover:bg-red-100 transition-colors"
                            >
                                All Absent
                            </button>
                        </div>
                    </div>

                    {/* Roster */}
                    <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-4">
                        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-text-primary">
                                Student Roster
                            </h2>
                            <span className="text-xs text-text-muted">
                                {markedCount}/{students.length} marked
                            </span>
                        </div>

                        {students.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                                <p className="text-sm font-semibold text-text-primary mb-1">No students enrolled</p>
                                <p className="text-xs text-text-secondary">
                                    Students will appear here once they join the course.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100">
                                {students.map((student) => (
                                    <StudentRow
                                        key={student.id}
                                        student={student}
                                        status={statuses[student.id] ?? null}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Save button */}
                    {students.length > 0 && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={isPending || !allMarked}
                                className="px-6 py-3 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Saving…
                                    </>
                                ) : (
                                    allMarked ? 'Save Attendance' : `Mark all students (${students.length - markedCount} remaining)`
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── History tab ──────────────────────────────────── */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    {historyLoading && (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-background rounded-2xl border border-neutral-200 p-4 animate-pulse">
                                    <div className="h-4 bg-neutral-200 rounded w-32 mb-3" />
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, j) => (
                                            <div key={j} className="flex justify-between">
                                                <div className="h-3 bg-neutral-200 rounded w-36" />
                                                <div className="h-5 bg-neutral-200 rounded-full w-16" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!historyLoading && sortedDates.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center px-6">
                            <p className="text-sm font-semibold text-text-primary mb-1">No history yet</p>
                            <p className="text-xs text-text-secondary">
                                Mark attendance for a session to see records here.
                            </p>
                        </div>
                    )}

                    {!historyLoading && sortedDates.map((d) => (
                        <div key={d} className="bg-background rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-neutral-100">
                                <p className="text-sm font-bold text-text-primary">
                                    {new Date(d).toLocaleDateString('en-US', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div className="divide-y divide-neutral-100">
                                {byDate[d].map((record) => (
                                    <div key={record.id} className="flex items-center justify-between px-5 py-3">
                                        <span className="text-sm text-text-primary">
                                            {record.enrollment?.student?.name ?? 'Unknown'}
                                        </span>
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_PILL[record.status]}`}>
                                            {record.status.charAt(0) + record.status.slice(1).toLowerCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherAttendancePage;
