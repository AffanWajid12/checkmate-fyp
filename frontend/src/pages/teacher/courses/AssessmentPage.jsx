import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    useAssessmentDetails, 
    useRunPlagiarismCheck, 
    useDeleteAssessment, 
    useUpdateAssessment,
    useAddSourceMaterials,
    useDeleteSourceMaterial 
} from '../../../hooks/useCourses';
import TeacherSidebar from '../TeacherSidebar';
import AIGradingTab from "./ai-grading/AIGradingTab";
import ManualEvaluationTab from './manual-evaluation/ManualEvaluationTab.jsx';
import { TrashIcon, PencilIcon, XMarkIcon } from '../courses/CoursePage/components/Icons';
import toast from 'react-hot-toast';

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

// ─── Plagiarism Report Tab ────────────────────────────────────────────────────

const RISK_COLORS = {
    low: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-red-50 text-red-700 border-red-200',
};

const RISK_BAR_COLORS = {
    low: 'bg-green-500',
    medium: 'bg-amber-500',
    high: 'bg-red-500',
};

const ShieldIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const PlagiarismTab = ({ courseId, assessmentId }) => {
    const [results, setResults] = useState(null);
    const [detailedStudent, setDetailedStudent] = useState(null);
    const { mutate: runCheck, isPending } = useRunPlagiarismCheck(courseId, assessmentId);

    const handleRunCheck = () => {
        runCheck(undefined, {
            onSuccess: (data) => setResults(data.results),
            onError: (err) => {
                const msg = err?.response?.data?.message || 'Plagiarism check failed. Is the backend or Python service running?';
                alert(msg);
            },
        });
    };

    if (!results) {
        return (
            <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-accent-50 flex items-center justify-center mx-auto text-accent-500">
                    <ShieldIcon />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">Plagiarism & AI Detection</h3>
                    <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
                        Analyze all submissions for this assessment to detect AI-generated content and cross-check similarity between student submissions.
                    </p>
                </div>
                <button
                    onClick={handleRunCheck}
                    disabled={isPending}
                    className="px-6 py-3 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                    {isPending ? (
                        <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Analyzing submissions…
                        </>
                    ) : (
                        <>
                            <ShieldIcon />
                            Run Plagiarism Check
                        </>
                    )}
                </button>
                {isPending && (
                    <p className="text-xs text-text-muted mt-2">This may take a minute depending on the number and size of submissions.</p>
                )}
            </div>
        );
    }

    const entries = Object.entries(results);

    // Backward compatibility / check for updated backend
    const isNewFormat = entries.length === 0 || entries[0][1].files !== undefined;
    if (!isNewFormat) {
        return (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 mt-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-red-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Backend Restart Required</h3>
                <p className="text-sm max-w-md mx-auto text-red-600 space-y-2">
                    <span>The plagiarism detection format has been upgraded to a student-wise report, but your Python backend is still returning the old format because it needs to be restarted.</span>
                    <br /><br />
                    <strong className="block text-red-800 bg-red-100 py-2 rounded-lg">Please stop and restart your Python plagiarism service (<code>python app.py</code>)</strong>
                </p>
                <button
                    onClick={handleRunCheck}
                    disabled={isPending}
                    className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                    {isPending ? 'Re-running…' : 'I have restarted it, Re-run Check'}
                </button>
            </div>
        );
    }

    // Detailed View for a specific student
    if (detailedStudent && results[detailedStudent]) {
        const studentData = results[detailedStudent];
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setDetailedStudent(null)}
                        className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition-colors"
                        title="Back to Overview"
                    >
                        <BackIcon />
                    </button>
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">{studentData.studentName}</h3>
                        <p className="text-xs text-text-muted">Detailed Plagiarism Report</p>
                    </div>
                </div>

                {studentData.files.map((file, idx) => {
                    const riskColor = RISK_COLORS[file.ai_risk_level] || RISK_COLORS.low;
                    return (
                        <div key={idx} className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-4">
                            {/* File header */}
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-accent-500">
                                            {(studentData.studentName || '?')[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">{studentData.studentName || 'Unknown'}</p>
                                        <p className="text-xs text-text-muted">{file.originalFileName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* AI Detection */}
                            <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">AI Detection</p>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${riskColor}`}>
                                        {file.ai_risk_level?.toUpperCase()} — {file.ai_likelihood}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-2 rounded-full transition-all ${RISK_BAR_COLORS[file.ai_risk_level] || 'bg-green-500'}`}
                                        style={{ width: `${Math.min(file.ai_likelihood, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Similarities */}
                            {file.similarities?.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                                        Similarity with other submissions
                                    </p>
                                    {file.similarities.map((sim, sIdx) => {
                                        const simRisk = sim.status || 'low';
                                        const simRiskColor = RISK_COLORS[simRisk];
                                        return (
                                            <div key={sIdx} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-text-primary font-medium truncate">
                                                        {sim.compared_with_student || sim.compared_with}
                                                    </p>
                                                    <p className="text-xs text-text-muted truncate">{sim.compared_with_file || ''}</p>
                                                </div>
                                                <div className="w-24 h-1.5 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
                                                    <div
                                                        className={`h-1.5 rounded-full ${RISK_BAR_COLORS[simRisk]}`}
                                                        style={{ width: `${Math.min(sim.similarity, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${simRiskColor}`}>
                                                    {sim.similarity}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    // Overview View
    return (
        <div className="space-y-4">
            {/* Summary header */}
            <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-text-primary">Analysis Complete</h3>
                    <p className="text-xs text-text-muted">{entries.length} student{entries.length !== 1 ? 's' : ''} analyzed</p>
                </div>
                <button
                    onClick={handleRunCheck}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-semibold text-text-secondary hover:bg-neutral-50 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                    {isPending ? (
                        <>
                            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Re-running…
                        </>
                    ) : 'Re-run Check'}
                </button>
            </div>

            {/* Student Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entries.map(([studentName, data]) => {
                    const aiRisk = data.average_ai_likelihood >= 70 ? 'high' : data.average_ai_likelihood >= 40 ? 'medium' : 'low';
                    const simRisk = data.average_similarity >= 70 ? 'high' : data.average_similarity >= 40 ? 'medium' : 'low';

                    return (
                        <div
                            key={studentName}
                            onClick={() => setDetailedStudent(studentName)}
                            className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-4 hover:border-accent-300 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-200 transition-colors">
                                    <span className="text-xs font-bold text-accent-600">
                                        {(studentName || '?')[0].toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-text-primary truncate">{studentName}</p>
                                    <p className="text-xs text-text-muted">{data.files.length} file{data.files.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-text-muted group-hover:text-accent-500 transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-text-muted font-medium">Avg AI Likelihood</span>
                                        <span className={`font-bold ${aiRisk === 'high' ? 'text-red-600' : aiRisk === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                                            {data.average_ai_likelihood}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${RISK_BAR_COLORS[aiRisk]}`}
                                            style={{ width: `${Math.min(data.average_ai_likelihood, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-text-muted font-medium">Avg Similarity</span>
                                        <span className={`font-bold ${simRisk === 'high' ? 'text-red-600' : simRisk === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                                            {data.average_similarity}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${RISK_BAR_COLORS[simRisk]}`}
                                            style={{ width: `${Math.min(data.average_similarity, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
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

// ─── Edit Modal ──────────────────────────────────────────────────────────────

const EditAssessmentModal = ({ assessment, courseId, onClose }) => {
    const [title, setTitle] = useState(assessment.title);
    const [type, setType] = useState(assessment.type);
    const [instructions, setInstructions] = useState(assessment.instructions || '');
    const [dueDate, setDueDate] = useState(assessment.due_date ? assessment.due_date.split('T')[0] : '');
    const [dueTime, setDueTime] = useState(assessment.due_date ? new Date(assessment.due_date).toTimeString().slice(0, 5) : '23:59');
    const [newFiles, setNewFiles] = useState([]);

    const { mutateAsync: updateAsmt, isPending: isUpdating } = useUpdateAssessment(courseId);
    const { mutateAsync: addMaterials, isPending: isUploading } = useAddSourceMaterials(courseId, assessment.id);
    const { mutateAsync: deleteMaterial } = useDeleteSourceMaterial(courseId, assessment.id);

    const handleSubmit = async (e) => {
        e.preventDefault();
        let finalDueDate = null;
        if (dueDate) {
            finalDueDate = new Date(`${dueDate}T${dueTime}:00`).toISOString();
        }

        try {
            // 1. Update basic settings
            await updateAsmt({
                assessmentId: assessment.id,
                title: title.trim(),
                type,
                instructions: instructions.trim(),
                due_date: finalDueDate,
            });

            // 2. Upload new files if any
            if (newFiles.length > 0) {
                const formData = new FormData();
                newFiles.forEach(file => formData.append('files', file));
                await addMaterials(formData);
            }

            toast.success('Assessment updated successfully');
            onClose();
        } catch (error) {
            console.error('Update failed:', error);
            toast.error(error.response?.data?.message || 'Failed to update assessment');
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        if (!window.confirm('Delete this source material?')) return;
        try {
            await deleteMaterial(materialId);
            toast.success('Material removed');
        } catch (error) {
            toast.error('Failed to remove material');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-neutral-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
                    <h3 className="text-lg font-bold text-text-primary">Edit Assessment Settings</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"><XMarkIcon /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:ring-2 focus:ring-accent-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:ring-2 focus:ring-accent-400 focus:outline-none"
                            >
                                <option value="ASSIGNMENT">Assignment</option>
                                <option value="QUIZ">Quiz</option>
                                <option value="EXAM">Exam</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Instructions</label>
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:ring-2 focus:ring-accent-400 focus:outline-none resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:ring-2 focus:ring-accent-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Due Time</label>
                                <input
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:ring-2 focus:ring-accent-400 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="pt-4 border-t border-neutral-100">
                        <label className="block text-xs font-bold text-text-muted uppercase mb-3">Source Materials</label>
                        
                        {/* Existing Files */}
                        {assessment.source_materials?.length > 0 && (
                            <div className="space-y-2 mb-4">
                                {assessment.source_materials.map(m => (
                                    <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-100 group">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileIcon mime={m.mime_type} />
                                            <span className="text-xs font-medium text-text-primary truncate">{m.file_name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteMaterial(m.id)}
                                            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <TrashIcon size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New Uploads */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {newFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-bold text-primary">
                                        <span className="truncate max-w-[100px]">{file.name}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setNewFiles(newFiles.filter((_, i) => i !== idx))}
                                            className="hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-neutral-200 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                                <input 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    onChange={(e) => setNewFiles([...newFiles, ...Array.from(e.target.files)])}
                                />
                                <svg className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-xs font-bold text-neutral-500 group-hover:text-primary transition-colors">Add New Materials</span>
                            </label>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-neutral-100 py-4 mt-auto shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-text-secondary hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating || isUploading}
                            className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-black transition-all shadow-lg shadow-black/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {(isUpdating || isUploading) ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : 'Update Assessment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherAssessmentPage = () => {
    const { courseId, assessmentId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('details');
    const [showEditModal, setShowEditModal] = useState(false);

    const { data, isLoading, isError } = useAssessmentDetails(courseId, assessmentId);
    const { mutateAsync: deleteAsmt, isPending: isDeleting } = useDeleteAssessment(courseId);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this assessment? All student submissions and attachments will be permanently deleted.')) {
            return;
        }

        try {
            await deleteAsmt(assessmentId);
            toast.success('Assessment deleted successfully');
            navigate(`/teacher/courses/${courseId}`);
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error(error.response?.data?.message || 'Failed to delete assessment');
        }
    };

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

    const tabs = [
        { key: 'details', label: 'Details' },
        { key: 'submissions', label: 'Submissions' },
        { key: 'plagiarism', label: 'Plagiarism' },
        { key: 'ai-grading', label: 'AI Grading' },
        { key: 'manual-evaluation', label: 'Manual Evaluation' }
    ];

    return (
        <TeacherSidebar>
            <div className={`${activeTab === 'ai-grading' ? 'max-w-6xl' : 'max-w-6xl'} mx-auto pb-16 p-6 transition-all duration-300`}>
                {/* Back + Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center bg-black p-2 text-sm rounded-xl text-white font-bold gap-1.5 transition-colors mb-4 cursor-pointer"

                    >
                        <BackIcon />
                        Back to Course
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center border border-neutral-200 shadow-sm sm:justify-between gap-4 bg-white p-6 rounded-2xl">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary mb-2">{assessment.title}</h1>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeMeta.color}`}>
                                    {typeMeta.label}
                                </span>
                                {assessment.due_date && (
                                    <span className="text-xs text-text-muted">Due {formatDateTime(assessment.due_date)}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="px-4 py-2 rounded-xl text-text-muted hover:text-accent-500 hover:bg-neutral-50 transition-all cursor-pointer border border-neutral-200 hover:border-accent-400"
                                    title="Edit Assessment Settings"
                                >
                                    <div className="flex items-center gap-2">
                                        <PencilIcon size={14} />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Edit Settings</span>
                                    </div>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="p-2 rounded-xl text-text-muted hover:text-error hover:bg-error/10 transition-all disabled:opacity-50 cursor-pointer border border-neutral-100 hover:border-error/20"
                                    title="Delete Assessment"
                                >
                                    {isDeleting ? (
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <TrashIcon size={14} />
                                            <span className="text-xs font-semibold uppercase tracking-wider">Delete</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                            <span className="text-xs text-text-secondary font-bold bg-neutral-50 px-3 py-1 rounded-full border border-neutral-100">
                                {totalSubs} submission{totalSubs !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Edit Modal */}
                {showEditModal && (
                    <EditAssessmentModal
                        assessment={assessment}
                        courseId={courseId}
                        onClose={() => setShowEditModal(false)}
                    />
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-neutral-100 p-1 rounded-xl w-fit">
                    {tabs.map((tab) => (
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
                {activeTab === 'plagiarism' && (
                    <PlagiarismTab
                        courseId={courseId}
                        assessmentId={assessmentId}
                    />
                )}
                {activeTab === 'ai-grading' && (
                    <AIGradingTab
                        courseId={courseId}
                        assessmentId={assessmentId}
                        submitted={submitted}
                        late={late}
                        sourceMaterials={assessment.source_materials}
                    />
                )}
                {activeTab === 'manual-evaluation' && (
                    <ManualEvaluationTab
                        courseId={courseId}
                        assessment={assessment}
                        submitted={submitted}
                        late={late}
                        notSubmitted={not_submitted}
                    />
                )}
            </div>
        </TeacherSidebar>
    );
};

export default TeacherAssessmentPage;
