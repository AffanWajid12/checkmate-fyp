import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useMarkAttendance, useCourseAttendance, useDeleteAttendanceSession } from '../../../../../hooks/useCourses';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUSES = ['PRESENT', 'ABSENT', 'LATE'];

const STATUS_CONFIG = {
    PRESENT: { label: 'Present', active: 'bg-success text-white border-success', idle: 'border-neutral-200 text-text-secondary hover:border-success hover:text-success' },
    ABSENT: { label: 'Absent', active: 'bg-red-500 text-white border-red-500', idle: 'border-neutral-200 text-text-secondary hover:border-red-400 hover:text-red-500' },
    LATE: { label: 'Late', active: 'bg-amber-500 text-white border-amber-500', idle: 'border-neutral-200 text-text-secondary hover:border-amber-400 hover:text-amber-600' },
};

const STATUS_PILL = {
    PRESENT: 'bg-success-light text-success border-green-200',
    ABSENT: 'bg-red-50 text-red-500 border-red-200',
    LATE: 'bg-amber-50 text-amber-600 border-amber-200',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

// ─── Icons ────────────────────────────────────────────────────────────────────

const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// ─── Student Row ──────────────────────────────────────────────────────────────

const StudentRow = ({ student, status, onStatusChange }) => (
    <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-xs font-bold text-accent-500 flex-shrink-0 overflow-hidden border border-neutral-200">
                {student.profile_picture ? (
                    <img
                        src={student.profile_picture}
                        alt={student.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span>{student.name?.charAt(0).toUpperCase() ?? '?'}</span>
                )}
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
                        className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer ${isActive ? cfg.active : cfg.idle}`}
                    >
                        {cfg.label}
                    </button>
                );
            })}
        </div>
    </div>
);

// ─── Attendance Tab ───────────────────────────────────────────────────────────

const AttendanceTab = ({ course, courseId }) => {
    const [date, setDate] = useState(todayISO());
    const [title, setTitle] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [statuses, setStatuses] = useState({});
    const [activeSubTab, setActiveSubTab] = useState('mark');

    const students = course?.students?.map((e) => e.student) ?? [];
    const { mutate: markAttendance, isPending } = useMarkAttendance(courseId);
    const { mutate: deleteSession, isPending: deletePending } = useDeleteAttendanceSession(courseId);
    const { data: sessions = [], isLoading: historyLoading } = useCourseAttendance(courseId);

    const handleStatusChange = (studentId, status) => {
        setStatuses((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleMarkAll = (status) => {
        const all = {};
        students.forEach((s) => { all[s.id] = status; });
        setStatuses(all);
    };

    const handleReset = () => {
        setSessionId(null);
        setTitle('');
        setDate(todayISO());
        setStatuses({});
        toast.success("Ready for new session");
    };

    const handleSubmit = () => {
        const records = students.map((s) => ({
            student_id: s.id,
            status: statuses[s.id] ?? 'ABSENT',
        }));

        markAttendance(
            { sessionId, date, title, records },
            {
                onSuccess: () => {
                    toast.success(sessionId ? `Attendance updated for ${title || date}` : `Attendance saved for ${title || date}`);
                    handleReset();
                },
                onError: () => toast.error('Failed to save attendance.'),
            }
        );
    };

    const handleEdit = (session) => {
        setSessionId(session.id);
        setTitle(session.title || '');
        setDate(session.date.slice(0, 10));
        
        const newStatuses = {};
        (session.records || []).forEach(r => {
            // Find student ID from enrollment
            newStatuses[r.enrollment.student_id] = r.status;
        });
        setStatuses(newStatuses);
        setActiveSubTab('mark');
        toast.success("Loaded session for editing");
    };

    const markedCount = Object.keys(statuses).length;
    const allMarked = students.length > 0 && markedCount === students.length;

    return (
        <div className="space-y-4">
            {/* Sub-tab switcher */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {[
                        { key: 'mark', label: sessionId ? 'Edit Session' : 'Mark Attendance' },
                        { key: 'history', label: 'History' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveSubTab(key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${activeSubTab === key
                                ? 'bg-primary text-text-inverse border-primary'
                                : 'border-neutral-200 text-text-secondary hover:bg-neutral-50'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {sessionId && activeSubTab === 'mark' && (
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-xs font-bold text-accent-600 hover:text-accent-700 transition-colors cursor-pointer"
                    >
                        <PlusIcon />
                        New Session
                    </button>
                )}
            </div>

            {/* ── Mark Attendance ───────────────────────────── */}
            {activeSubTab === 'mark' && (
                <>
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1.5">Lecture Title (e.g. Lecture 1)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter lecture name..."
                                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1.5">Session Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1 border-t border-neutral-100 mt-2">
                            <button onClick={() => handleMarkAll('PRESENT')} className="px-3 py-2 rounded-lg border border-green-200 text-success bg-success-light text-[10px] font-bold uppercase tracking-wider hover:bg-green-100 transition-colors cursor-pointer">
                                All Present
                            </button>
                            <button onClick={() => handleMarkAll('ABSENT')} className="px-3 py-2 rounded-lg border border-red-200 text-red-500 bg-red-50 text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition-colors cursor-pointer">
                                All Absent
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-text-primary">
                                {sessionId ? 'Editing Records' : 'Student Roster'}
                            </h2>
                            <span className="text-xs text-text-muted">{markedCount}/{students.length} marked</span>
                        </div>
                        {students.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                                <p className="text-sm font-semibold text-text-primary mb-1">No students enrolled</p>
                                <p className="text-xs text-text-secondary">Students will appear here once they join the course.</p>
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

                    {students.length > 0 && (
                        <div className="flex justify-end gap-3">
                            {sessionId && (
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-3 rounded-xl border border-neutral-300 text-text-secondary text-sm font-semibold hover:bg-neutral-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSubmit}
                                disabled={isPending || !allMarked}
                                className="px-6 py-3 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                            >
                                {isPending ? 'Saving…' : sessionId ? 'Update Attendance' : allMarked ? 'Save Attendance' : `Mark all students (${students.length - markedCount} remaining)`}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── History ──────────────────────────────────── */}
            {activeSubTab === 'history' && (
                <div className="space-y-4">
                    {historyLoading && (
                        <div className="space-y-4">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-5 animate-pulse">
                                    <div className="h-5 bg-neutral-200 rounded w-48 mb-4" />
                                    <div className="space-y-3">
                                        <div className="h-4 bg-neutral-100 rounded w-full" />
                                        <div className="h-4 bg-neutral-100 rounded w-5/6" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!historyLoading && sessions.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center px-6">
                            <p className="text-sm font-semibold text-text-primary mb-1">No history yet</p>
                            <p className="text-xs text-text-secondary">Mark attendance for a session to see records here.</p>
                        </div>
                    )}

                    {!historyLoading && sessions.map((session) => (
                        <div key={session.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/30">
                                <div>
                                    <p className="text-sm font-bold text-text-primary">
                                        {session.title || 'Untitled Session'}
                                    </p>
                                    <p className="text-[11px] text-text-muted font-medium mt-0.5 uppercase tracking-wider">
                                        {new Date(session.date).toLocaleDateString('en-US', {
                                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(session)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-bold text-text-primary hover:border-accent-400 hover:text-accent-600 transition-all shadow-sm cursor-pointer"
                                    >
                                        <EditIcon />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to delete this attendance session? This cannot be undone.')) {
                                                deleteSession(session.id, {
                                                    onSuccess: () => {
                                                        toast.success('Attendance session deleted');
                                                        if (sessionId === session.id) handleReset();
                                                    },
                                                    onError: () => toast.error('Failed to delete session')
                                                });
                                            }
                                        }}
                                        disabled={deletePending}
                                        className="flex items-center justify-center p-2 rounded-lg border border-red-200 text-red-500 bg-white hover:bg-red-50 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                        title="Delete Session"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            <div className="divide-y divide-neutral-100">
                                {session.records?.map((record) => (
                                    <div key={record.id} className="flex items-center justify-between px-5 py-3">
                                        <span className="text-xs font-semibold text-text-primary">
                                            {record.enrollment?.student?.name ?? 'Unknown Student'}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_PILL[record.status]}`}>
                                            {record.status}
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

export default AttendanceTab;
