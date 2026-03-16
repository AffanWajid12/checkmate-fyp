import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessmentDetails } from '../../../hooks/useCourses';
import TeacherSidebar from '../TeacherSidebar';

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

const FileIcon = ({ mime }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        className={`w-4 h-4 flex-shrink-0 ${mime === 'application/pdf' ? 'text-red-500' : 'text-blue-500'}`}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-text-muted">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
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

const TYPE_META = {
    QUIZ: { label: 'Quiz', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    ASSIGNMENT: { label: 'Assignment', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    EXAM: { label: 'Exam', color: 'bg-amber-50 text-amber-600 border-amber-200' },
};

const STATUS_META = {
    SUBMITTED: { label: 'Submitted', color: 'bg-success-light text-success' },
    LATE: { label: 'Late', color: 'bg-amber-50 text-amber-600' },
    GRADED: { label: 'Graded', color: 'bg-accent-50 text-accent-500' },
    NOT_SUBMITTED: { label: 'Not Submitted', color: 'bg-neutral-100 text-text-muted' },
};

// ─── File Chip ────────────────────────────────────────────────────────────────

const FileChip = ({ material }) => (
    <a
        href={material.signed_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-accent-300 hover:bg-accent-50 transition-colors text-sm"
    >
        <FileIcon mime={material.mime_type} />
        <span className="text-text-primary truncate max-w-[200px]">{material.file_name}</span>
        <span className="text-text-muted text-xs hidden sm:inline">{formatBytes(material.file_size)}</span>
        <ExternalLinkIcon />
    </a>
);

// ─── Details Tab ──────────────────────────────────────────────────────────────

const DetailsTab = ({ assessment }) => {
    const typeMeta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: instructions + source materials */}
            <div className="lg:col-span-2 space-y-6">
                {/* Instructions */}
                <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-text-primary mb-3">Instructions</h3>
                    {assessment.instructions ? (
                        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                            {assessment.instructions}
                        </p>
                    ) : (
                        <p className="text-sm text-text-muted italic">No instructions provided.</p>
                    )}
                </div>

                {/* Source Materials */}
                {assessment.source_materials?.length > 0 && (
                    <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-text-primary mb-3">
                            Source Materials
                            <span className="ml-2 text-xs font-normal text-text-muted">
                                ({assessment.source_materials.length} file{assessment.source_materials.length !== 1 ? 's' : ''})
                            </span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {assessment.source_materials.map((m) => (
                                <FileChip key={m.id} material={m} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: settings sidebar */}
            <div className="space-y-4">
                <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-4">
                    <h3 className="text-sm font-bold text-text-primary">Settings</h3>

                    <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Type</p>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeMeta.color}`}>
                            {typeMeta.label}
                        </span>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Due Date</p>
                        <p className="text-sm text-text-primary">
                            {assessment.due_date ? formatDateTime(assessment.due_date) : 'No deadline'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Created</p>
                        <p className="text-sm text-text-primary">{formatDateTime(assessment.createdAt)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Submissions Tab ──────────────────────────────────────────────────────────

const SubmissionRow = ({ submission, status, courseId, assessmentId }) => {
    const navigate = useNavigate();
    const meta = STATUS_META[status] ?? STATUS_META.SUBMITTED;
    return (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {submission.user?.profile_picture ? (
                    <img
                        src={submission.user.profile_picture}
                        alt={submission.user?.name ?? 'Student'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-xs font-bold text-accent-500">
                        {(submission.user?.name ?? submission.name ?? '?')[0].toUpperCase()}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                    {submission.user?.name ?? submission.name ?? 'Unknown'}
                </p>
                {submission.submitted_at && (
                    <p className="text-xs text-text-muted">{formatDateTime(submission.submitted_at)}</p>
                )}
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color} flex-shrink-0`}>
                {meta.label}
            </span>
            {submission.submitted_at && (
                <button
                    onClick={() => navigate(`/teacher/courses/${courseId}/assessments/${assessmentId}/submissions/${submission.id}`)}
                    className="text-xs font-semibold text-accent-500 hover:text-accent-600 transition-colors flex-shrink-0 px-2"
                >
                    Review →
                </button>
            )}
        </div>
    );
};

const SubmissionsTab = ({ submitted, late, notSubmitted, courseId, assessmentId }) => {
    const [search, setSearch] = useState('');
    const q = search.toLowerCase();

    const filterName = (s) => (s.user?.name ?? s.name ?? '').toLowerCase().includes(q);

    const sections = [
        { key: 'submitted', label: 'Submitted', items: submitted.filter(filterName), status: 'SUBMITTED', dotColor: 'bg-success' },
        { key: 'late', label: 'Late', items: late.filter(filterName), status: 'LATE', dotColor: 'bg-amber-400' },
        { key: 'missing', label: 'Not Submitted', items: notSubmitted.filter(filterName), status: 'NOT_SUBMITTED', dotColor: 'bg-neutral-300' },
    ];

    const total = submitted.length + late.length + notSubmitted.length;
    const done = submitted.length + late.length;

    return (
        <div className="space-y-6">
            {/* Summary bar */}
            <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-text-primary">{done} / {total} submitted</p>
                    <p className="text-xs text-text-muted">{notSubmitted.length} missing</p>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                        className="h-2 bg-success rounded-full transition-all"
                        style={{ width: total ? `${(done / total) * 100}%` : '0%' }}
                    />
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <SearchIcon />
                </span>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by student name…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                />
            </div>

            {/* Sections */}
            {sections.map(({ key, label, items, status, dotColor }) => (
                items.length > 0 && (
                    <div key={key}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                            <h3 className="text-sm font-bold text-text-primary">{label}</h3>
                            <span className="text-xs text-text-muted">({items.length})</span>
                        </div>
                        <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm divide-y divide-neutral-100 overflow-hidden">
                            {items.map((s) => (
                                <SubmissionRow
                                    key={s.id}
                                    submission={s}
                                    status={status ?? 'NOT_SUBMITTED'}
                                    courseId={courseId}
                                    assessmentId={assessmentId}
                                />
                            ))}
                        </div>
                    </div>
                )
            ))}

            {sections.every(({ items }) => items.length === 0) && (
                <p className="text-center text-sm text-text-muted py-10">No students match your search.</p>
            )}
        </div>
    );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const PageSkeleton = () => (
    <div className="animate-pulse space-y-6">
        <div className="h-8 bg-neutral-200 rounded w-1/2" />
        <div className="h-5 bg-neutral-100 rounded w-1/4" />
        <div className="h-40 bg-neutral-100 rounded-2xl" />
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherAssessmentPage = () => {
    const { courseId, assessmentId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('details');

    const { data, isLoading, isError } = useAssessmentDetails(courseId, assessmentId);

    if (isLoading) return <TeacherSidebar><div className="max-w-4xl mx-auto p-6"><PageSkeleton /></div></TeacherSidebar>;
    if (isError || !data) return (
        <TeacherSidebar>
            <div className="max-w-4xl mx-auto text-center py-20 p-6">
                <p className="text-sm text-error">Failed to load assessment. Please try again.</p>
            </div>
        </TeacherSidebar>
    );

    const { assessment, submitted = [], late = [], not_submitted = [] } = data;
    const typeMeta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;
    const totalSubs = submitted.length + late.length;

    return (
        <TeacherSidebar>
            <div className="max-w-4xl mx-auto pb-16 p-6">
                {/* Back + Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
                    >
                        <BackIcon />
                        Back to Course
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeMeta.color}`}>
                                    {typeMeta.label}
                                </span>
                                {assessment.due_date && (
                                    <span className="text-xs text-text-muted">Due {formatDateTime(assessment.due_date)}</span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary">{assessment.title}</h1>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm text-text-secondary font-medium">{totalSubs} submission{totalSubs !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-neutral-100 p-1 rounded-xl w-fit">
                    {[
                        { key: 'details', label: 'Assessment Details' },
                        { key: 'submissions', label: `Submissions (${totalSubs})` },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.key
                                ? 'bg-background text-text-primary shadow-sm'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === 'details' && <DetailsTab assessment={assessment} />}
                {activeTab === 'submissions' && (
                    <SubmissionsTab
                        submitted={submitted}
                        late={late}
                        notSubmitted={not_submitted}
                        courseId={courseId}
                        assessmentId={assessmentId}
                    />
                )}
            </div>
        </TeacherSidebar>
    );
};

export default TeacherAssessmentPage;
