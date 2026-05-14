import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTeacherAllReevaluations, useRespondToReevaluation } from '../../../../../hooks/useCourses';

// ─── Icons ──────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const XIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ClockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const InboxIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
);

// ─── Teacher Note Modal ─────────────────────────────────────────────────────────

const TeacherNoteModal = ({ isOpen, onClose, onSubmit, isLoading, action, studentName }) => {
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    const isReject = action === 'REJECTED';

    const handleSubmit = () => {
        if (isReject && !note.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        onSubmit(note);
        setNote('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-md mx-4 p-6">
                <h3 className="text-lg font-bold text-text-primary mb-1">
                    {isReject ? 'Reject' : 'Accept'} Re-evaluation
                </h3>
                <p className="text-sm text-text-muted mb-4">
                    {isReject
                        ? `Explain to ${studentName} why the request is being rejected.`
                        : `The submission will be reset for ${studentName} and you can re-grade it.`
                    }
                </p>

                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                    {isReject ? 'Reason for Rejection' : 'Note (Optional)'}
                </label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={isReject ? 'e.g. The original grading is accurate based on the rubric...' : 'Optional note for the student...'}
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 outline-none transition-all resize-none"
                    rows={3}
                    maxLength={500}
                />

                <div className="flex gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-text-secondary bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || (isReject && !note.trim())}
                        className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                            isReject
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                    >
                        {isLoading ? 'Processing...' : isReject ? 'Reject Request' : 'Accept & Reset'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Status Badge ───────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    const config = {
        PENDING: { text: 'Pending', bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-200', icon: <ClockIcon /> },
        ACCEPTED: { text: 'Accepted', bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-200', icon: <CheckIcon /> },
        REJECTED: { text: 'Rejected', bg: 'bg-red-50', color: 'text-red-500', border: 'border-red-200', icon: <XIcon /> },
    };
    const c = config[status] || config.PENDING;

    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${c.bg} ${c.color} ${c.border}`}>
            {c.icon}
            {c.text}
        </span>
    );
};

// ─── Request Card ───────────────────────────────────────────────────────────────

const RequestCard = ({ request, onAccept, onReject }) => {
    const student = request.student;
    const assessment = request.submission?.assessment;
    const course = assessment?.announcement?.course;
    const previousScore = request.submission?.evaluation?.total_score ?? request.submission?.grade;

    const initial = student?.name?.[0]?.toUpperCase() || '?';

    return (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            {/* Header: student info + course badge */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {initial}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-primary">{student?.name}</p>
                        <p className="text-xs text-text-muted">{student?.email}</p>
                    </div>
                </div>
                <StatusBadge status={request.status} />
            </div>

            {/* Assessment info */}
            <div className="bg-neutral-50 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-0.5">Assessment</p>
                        <p className="text-sm font-bold text-text-primary">{assessment?.title}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-0.5">Previous Score</p>
                        <p className="text-sm font-bold text-accent-500">{previousScore ?? '—'}</p>
                    </div>
                </div>
                {course && (
                    <p className="text-[10px] font-bold text-text-muted mt-2">
                        {course.code}: {course.title}
                    </p>
                )}
            </div>

            {/* Student reason */}
            {request.student_reason && (
                <div className="mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Student's Reason</p>
                    <p className="text-sm text-text-secondary bg-neutral-50 rounded-xl p-3 italic">
                        "{request.student_reason}"
                    </p>
                </div>
            )}

            {/* Teacher note (for processed requests) */}
            {request.teacher_note && request.status !== 'PENDING' && (
                <div className="mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Your Response</p>
                    <p className="text-sm text-text-secondary bg-neutral-50 rounded-xl p-3">
                        "{request.teacher_note}"
                    </p>
                </div>
            )}

            {/* Date */}
            <p className="text-[10px] text-text-muted mb-3">
                Requested {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>

            {/* Actions (only for PENDING) */}
            {request.status === 'PENDING' && (
                <div className="flex gap-2 pt-3 border-t border-neutral-100">
                    <button
                        onClick={() => onAccept(request)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                        <CheckIcon /> Accept
                    </button>
                    <button
                        onClick={() => onReject(request)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                    >
                        <XIcon /> Reject
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Main Tab Component ─────────────────────────────────────────────────────────

const ReevaluationsTab = ({ courseId }) => {
    const { data: allRequests = [], isLoading } = useTeacherAllReevaluations();
    const respondMutation = useRespondToReevaluation();
    const [modal, setModal] = useState({ open: false, request: null, action: null });
    const [filter, setFilter] = useState('PENDING');

    // Filter requests for this specific course
    const courseRequests = allRequests.filter(r => {
        const reqCourseId = r.submission?.assessment?.announcement?.course?.id;
        return reqCourseId === courseId;
    });

    const filteredRequests = filter === 'ALL'
        ? courseRequests
        : courseRequests.filter(r => r.status === filter);

    const pendingCount = courseRequests.filter(r => r.status === 'PENDING').length;

    const handleRespond = (note) => {
        if (!modal.request || !modal.action) return;
        respondMutation.mutate(
            {
                requestId: modal.request.id,
                action: modal.action,
                teacherNote: note || undefined,
            },
            {
                onSuccess: (data) => {
                    toast.success(data.message || `Request ${modal.action.toLowerCase()}`);
                    setModal({ open: false, request: null, action: null });
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Failed to process request');
                },
            }
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-neutral-100 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header + Filter */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-lg font-bold text-text-primary">Re-evaluation Requests</h2>
                    <p className="text-sm text-text-muted">
                        {pendingCount > 0
                            ? `${pendingCount} pending request${pendingCount !== 1 ? 's' : ''}`
                            : 'No pending requests'}
                    </p>
                </div>

                <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
                    {['PENDING', 'ACCEPTED', 'REJECTED', 'ALL'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                                filter === f
                                    ? 'bg-white text-text-primary shadow-sm'
                                    : 'text-text-muted hover:text-text-secondary'
                            }`}
                        >
                            {f === 'ALL' ? 'All' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Request Cards */}
            {filteredRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRequests.map(req => (
                        <RequestCard
                            key={req.id}
                            request={req}
                            onAccept={(r) => setModal({ open: true, request: r, action: 'ACCEPTED' })}
                            onReject={(r) => setModal({ open: true, request: r, action: 'REJECTED' })}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 text-text-muted flex items-center justify-center mb-4">
                        <InboxIcon />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests</h3>
                    <p className="text-sm text-text-muted mt-1">
                        {filter === 'PENDING'
                            ? 'All re-evaluation requests have been processed.'
                            : 'No re-evaluation requests match this filter.'}
                    </p>
                </div>
            )}

            {/* Response Modal */}
            <TeacherNoteModal
                isOpen={modal.open}
                onClose={() => setModal({ open: false, request: null, action: null })}
                onSubmit={handleRespond}
                isLoading={respondMutation.isPending}
                action={modal.action}
                studentName={modal.request?.student?.name || 'the student'}
            />
        </div>
    );
};

export default ReevaluationsTab;
