import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetSubmissionDetails } from '../../../hooks/useCourses';
import apiClient from '../../../utils/apiClient';
import TeacherSidebar from '../TeacherSidebar';

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

const FileIcon = ({ mime }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        className={`w-5 h-5 flex-shrink-0 ${mime === 'application/pdf' ? 'text-red-500' : 'text-blue-500'}`}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const STATUS_META = {
    SUBMITTED: { label: 'Submitted', color: 'bg-success-light text-success' },
    LATE: { label: 'Late', color: 'bg-amber-50 text-amber-600' },
    GRADED: { label: 'Graded', color: 'bg-accent-50 text-accent-500' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const PageSkeleton = () => (
    <TeacherSidebar>
        <div className="animate-pulse space-y-6 max-w-3xl mx-auto p-6">
            <div className="h-5 bg-neutral-200 rounded w-32" />
            <div className="h-8 bg-neutral-200 rounded w-1/2" />
            <div className="h-32 bg-neutral-100 rounded-2xl" />
            <div className="h-48 bg-neutral-100 rounded-2xl" />
        </div>
    </TeacherSidebar>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ViewSubmissionPage = () => {
    const { courseId, assessmentId, submissionId } = useParams();
    const navigate = useNavigate();

    const { data: submission, isLoading, isError } = useGetSubmissionDetails(courseId, assessmentId, submissionId);

    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [grading, setGrading] = useState(false);

    const handleGrade = async (e) => {
        e.preventDefault();
        const parsed = parseFloat(grade);
        if (isNaN(parsed)) {
            toast.error('Please enter a valid numeric grade.');
            return;
        }

        setGrading(true);
        try {
            await apiClient.patch(
                `/api/courses/${courseId}/assessments/${assessmentId}/submissions/${submissionId}/grade`,
                { grade: parsed, feedback: feedback.trim() || undefined }
            );
            toast.success('Grade saved!');
        } catch (err) {
            const status = err?.response?.status;
            if (status === 501) {
                toast('Grading is not yet implemented on the server.', { icon: '🚧' });
            } else {
                toast.error(err?.response?.data?.error ?? 'Failed to save grade.');
            }
        } finally {
            setGrading(false);
        }
    };

    if (isLoading) return <PageSkeleton />;
    if (isError || !submission) return (
        <TeacherSidebar>
            <div className="max-w-3xl mx-auto text-center py-20 p-6">
                <p className="text-sm text-error">Failed to load submission. Please try again.</p>
            </div>
        </TeacherSidebar>
    );

    const statusMeta = STATUS_META[submission.status] ?? STATUS_META.SUBMITTED;
    const isGraded = submission.status === 'GRADED';

    return (
        <TeacherSidebar>
            <div className="max-w-3xl mx-auto pb-16 p-6">
                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
                >
                    <BackIcon />
                    Back to Assessment
                </button>

                {/* Student info header */}
                <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-accent-500">
                                    {(submission.user?.name ?? '?')[0].toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-text-primary">{submission.user?.name ?? 'Unknown Student'}</h1>
                                <p className="text-sm text-text-secondary">{submission.user?.email ?? ''}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta.color}`}>
                                {statusMeta.label}
                            </span>
                            <span className="text-xs text-text-muted">
                                Submitted {formatDateTime(submission.submitted_at)}
                            </span>
                        </div>
                    </div>

                    {isGraded && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">Grade</p>
                                <p className="text-xl font-bold text-text-primary">{submission.grade}</p>
                            </div>
                            {submission.feedback && (
                                <div>
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">Feedback</p>
                                    <p className="text-sm text-text-secondary">{submission.feedback}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Attachments */}
                <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-6 mb-6">
                    <h2 className="text-sm font-bold text-text-primary mb-4">
                        Submitted Files
                        <span className="ml-2 text-xs font-normal text-text-muted">
                            ({submission.attachments?.length ?? 0} file{(submission.attachments?.length ?? 0) !== 1 ? 's' : ''})
                        </span>
                    </h2>
                    {submission.attachments?.length > 0 ? (
                        <div className="space-y-2">
                            {submission.attachments.map((att) => (
                                <a
                                    key={att.id}
                                    href={att.signed_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-accent-300 hover:bg-accent-50 transition-colors group"
                                >
                                    <FileIcon mime={att.mime_type} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-text-primary font-medium truncate">{att.file_name}</p>
                                        <p className="text-xs text-text-muted">{formatBytes(att.file_size)}</p>
                                    </div>
                                    <span className="text-text-muted group-hover:text-accent-500 transition-colors">
                                        <ExternalLinkIcon />
                                    </span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted italic">No files attached to this submission.</p>
                    )}
                </div>

                {/* Grade form */}
                <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-text-primary mb-1">Grade this Submission</h2>
                    <p className="text-xs text-text-muted mb-4">
                        Grading is not yet implemented on the server — submitting will return a 501 stub response.
                    </p>
                    <form onSubmit={handleGrade} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">
                                Score <span className="text-error">*</span>
                            </label>
                            <input
                                type="number"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                placeholder="e.g. 87.5"
                                min="0"
                                step="0.5"
                                disabled={isGraded}
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">
                                Feedback <span className="text-text-muted font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Write feedback for the student…"
                                rows={4}
                                disabled={isGraded}
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isGraded || !grade || grading}
                                className="px-6 py-2.5 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {grading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Saving…
                                    </>
                                ) : isGraded ? 'Already Graded' : 'Save Grade'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </TeacherSidebar>
    );
};

export default ViewSubmissionPage;
