import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    useAssessmentDetails,
    useSubmitAssessment,
    useUpdateSubmission,
} from '../../../hooks/useCourses';

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

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-7 h-7 text-text-muted">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const XIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ClockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
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
    QUIZ:       { label: 'Quiz',       color: 'bg-blue-50 text-blue-600 border-blue-200' },
    ASSIGNMENT: { label: 'Assignment', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    EXAM:       { label: 'Exam',       color: 'bg-amber-50 text-amber-600 border-amber-200' },
};

const STATUS_META = {
    SUBMITTED: { label: 'Submitted', color: 'bg-success-light text-success' },
    LATE:      { label: 'Late',      color: 'bg-amber-50 text-amber-600' },
    GRADED:    { label: 'Graded',    color: 'bg-accent-50 text-accent-500' },
};

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 10;

// ─── Source Material Chip ─────────────────────────────────────────────────────

const MaterialChip = ({ material }) => (
    <a
        href={material.signed_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-accent-300 hover:bg-accent-50 transition-colors text-sm"
    >
        <FileIcon mime={material.mime_type} />
        <span className="text-text-primary truncate max-w-[180px]">{material.file_name}</span>
        <span className="text-text-muted text-xs hidden sm:inline">{formatBytes(material.file_size)}</span>
        <ExternalLinkIcon />
    </a>
);

// ─── Mini File Dropzone ───────────────────────────────────────────────────────

const MiniDropzone = ({ files, onChange }) => {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const addFiles = (incoming) => {
        const valid = [];
        for (const f of incoming) {
            if (!ALLOWED_TYPES.includes(f.type)) { toast.error(`"${f.name}" is not a PDF or image.`); continue; }
            if (f.size > MAX_SIZE_BYTES) { toast.error(`"${f.name}" exceeds 20 MB.`); continue; }
            if (files.length + valid.length >= MAX_FILES) { toast.error(`Max ${MAX_FILES} files.`); break; }
            valid.push(f);
        }
        if (valid.length) onChange([...files, ...valid]);
    };

    const remove = (idx) => onChange(files.filter((_, i) => i !== idx));

    return (
        <div className="space-y-2">
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-1.5 py-6 rounded-2xl border-2 border-dashed cursor-pointer transition-colors text-center ${dragging ? 'border-accent-400 bg-accent-50' : 'border-neutral-200 bg-neutral-50 hover:border-accent-300'}`}
            >
                <UploadIcon />
                <p className="text-xs text-text-secondary font-medium">Drop files or <span className="text-accent-500">browse</span></p>
                <p className="text-[11px] text-text-muted">PDF or images · 20 MB max</p>
                <input ref={inputRef} type="file" multiple accept=".pdf,image/*" className="hidden"
                    onChange={(e) => addFiles(Array.from(e.target.files))} />
            </div>
            {files.length > 0 && (
                <ul className="space-y-1.5">
                    {files.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm">
                            <FileIcon mime={f.type} />
                            <span className="flex-1 truncate text-text-primary">{f.name}</span>
                            <span className="text-xs text-text-muted">{formatBytes(f.size)}</span>
                            <button type="button" onClick={() => remove(i)} className="text-text-muted hover:text-error transition-colors">
                                <XIcon />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ─── Submission Portal ────────────────────────────────────────────────────────

const SubmissionPortal = ({ assessment, submission, courseId, assessmentId }) => {
    const [stagedFiles, setStagedFiles] = useState([]);
    const { mutate: submit, isPending: submitting } = useSubmitAssessment(courseId, assessmentId);
    const { mutate: update, isPending: updating } = useUpdateSubmission(courseId, assessmentId);

    const isGraded  = submission?.status === 'GRADED';
    const hasSubmitted = !!submission;
    const statusMeta = submission ? STATUS_META[submission.status] ?? STATUS_META.SUBMITTED : null;
    const due = assessment.due_date ? formatDateTime(assessment.due_date) : null;
    const isOverdue = assessment.due_date && new Date(assessment.due_date) < new Date();

    const handleTurnIn = () => {
        if (!stagedFiles.length) { toast.error('Add at least one file before submitting.'); return; }
        const fd = new FormData();
        stagedFiles.forEach((f) => fd.append('files', f));

        if (!hasSubmitted) {
            submit(fd, {
                onSuccess: () => { toast.success('Submitted!'); setStagedFiles([]); },
                onError: (err) => toast.error(err?.response?.data?.error ?? 'Submission failed.'),
            });
        } else {
            update(fd, {
                onSuccess: () => { toast.success('Files added!'); setStagedFiles([]); },
                onError: (err) => toast.error(err?.response?.data?.error ?? 'Update failed.'),
            });
        }
    };

    const isPending = submitting || updating;

    return (
        <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-4 lg:sticky lg:top-6">
            <h2 className="text-sm font-bold text-text-primary">Submission Portal</h2>

            {/* Due date */}
            {due && (
                <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-error' : 'text-text-secondary'}`}>
                    <ClockIcon />
                    <span>{isOverdue ? 'Was due' : 'Due'} {due}</span>
                </div>
            )}

            {/* Status */}
            {statusMeta && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Status</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta.color}`}>
                        {statusMeta.label}
                    </span>
                </div>
            )}

            {/* Graded result */}
            {isGraded && (
                <div className="pt-3 border-t border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Grade</span>
                        <span className="text-xl font-bold text-text-primary">{submission.grade}</span>
                    </div>
                    {submission.feedback && (
                        <div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Feedback</p>
                            <p className="text-sm text-text-secondary leading-relaxed">{submission.feedback}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Existing attachments */}
            {submission?.attachments?.length > 0 && (
                <div className="pt-3 border-t border-neutral-100">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Your Files</p>
                    <ul className="space-y-1.5">
                        {submission.attachments.map((att) => (
                            <li key={att.id}>
                                <a
                                    href={att.signed_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-accent-300 hover:bg-accent-50 transition-colors text-sm"
                                >
                                    <FileIcon mime={att.mime_type} />
                                    <span className="flex-1 truncate text-text-primary">{att.file_name}</span>
                                    <ExternalLinkIcon />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Upload area (blocked if graded) */}
            {!isGraded && (
                <div className="pt-3 border-t border-neutral-100">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                        {hasSubmitted ? 'Add More Files' : 'Add Work'}
                    </p>
                    <MiniDropzone files={stagedFiles} onChange={setStagedFiles} />
                </div>
            )}

            {/* Turn In button */}
            {!isGraded && (
                <button
                    onClick={handleTurnIn}
                    disabled={!stagedFiles.length || isPending}
                    className="w-full py-3 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            {hasSubmitted ? 'Uploading…' : 'Submitting…'}
                        </>
                    ) : hasSubmitted ? 'Add Files' : 'Turn In'}
                </button>
            )}
        </div>
    );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const PageSkeleton = () => (
    <div className="animate-pulse max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-3/4" />
            <div className="h-4 bg-neutral-100 rounded w-1/3" />
            <div className="h-40 bg-neutral-100 rounded-2xl" />
        </div>
        <div className="h-64 bg-neutral-100 rounded-2xl" />
    </div>
);

import StudentSidebar from '../StudentSidebar';

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentAssessmentPage = () => {
    const { courseId, assessmentId } = useParams();
    const navigate = useNavigate();

    const { data, isLoading, isError } = useAssessmentDetails(courseId, assessmentId);

    if (isLoading) return <StudentSidebar><div className="px-4 py-8"><PageSkeleton /></div></StudentSidebar>;
    if (isError || !data) return (
        <StudentSidebar>
            <div className="max-w-5xl mx-auto text-center py-20">
                <p className="text-sm text-error">Failed to load assessment. Please try again.</p>
            </div>
        </StudentSidebar>
    );

    const { assessment, submission } = data;
    const typeMeta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;

    return (
        <StudentSidebar>
            <div className="max-w-5xl mx-auto p-6 pb-16">
                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
                >
                    <BackIcon />
                    Back to Course
                </button>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column: details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title + badge */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeMeta.color}`}>
                                {typeMeta.label}
                            </span>
                            {assessment.due_date && (
                                <span className={`flex items-center gap-1 text-xs ${new Date(assessment.due_date) < new Date() ? 'text-error' : 'text-text-muted'}`}>
                                    <ClockIcon />
                                    Due {formatDateTime(assessment.due_date)}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary">{assessment.title}</h1>
                    </div>

                    {/* Instructions */}
                    <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold text-text-primary mb-3">Instructions</h2>
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
                            <h2 className="text-sm font-bold text-text-primary mb-3">
                                Source Materials
                                <span className="ml-2 text-xs font-normal text-text-muted">
                                    ({assessment.source_materials.length} file{assessment.source_materials.length !== 1 ? 's' : ''})
                                </span>
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {assessment.source_materials.map((m) => (
                                    <MaterialChip key={m.id} material={m} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column: submission portal */}
                <div>
                    <SubmissionPortal
                        assessment={assessment}
                        submission={submission ?? null}
                        courseId={courseId}
                        assessmentId={assessmentId}
                    />
                </div>
            </div>
            </div>
        </StudentSidebar>
    );
};

export default StudentAssessmentPage;
