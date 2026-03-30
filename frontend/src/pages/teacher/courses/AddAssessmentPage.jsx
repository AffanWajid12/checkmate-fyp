import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateAssessment } from '../../../hooks/useCourses';
import TeacherSidebar from '../TeacherSidebar';

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
);

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-8 h-8 text-text-muted">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
);

const FileIcon = ({ mime }) => {
    const isPDF = mime === 'application/pdf';
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`w-4 h-4 flex-shrink-0 ${isPDF ? 'text-red-500' : 'text-blue-500'}`}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
};

const XIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_FILES = 10;

const TYPE_OPTIONS = [
    { value: 'QUIZ', label: 'Quiz', color: 'data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 data-[active=true]:border-blue-200' },
    { value: 'ASSIGNMENT', label: 'Assignment', color: 'data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 data-[active=true]:border-purple-200' },
    { value: 'EXAM', label: 'Exam', color: 'data-[active=true]:bg-amber-50 data-[active=true]:text-amber-600 data-[active=true]:border-amber-200' },
];

// ─── File Dropzone ────────────────────────────────────────────────────────────

const FileDropzone = ({ files, onChange }) => {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const addFiles = (incoming) => {
        const valid = [];
        for (const f of incoming) {
            if (!ALLOWED_TYPES.includes(f.type)) {
                toast.error(`"${f.name}" is not a PDF or image.`);
                continue;
            }
            if (f.size > MAX_SIZE_BYTES) {
                toast.error(`"${f.name}" exceeds 20 MB.`);
                continue;
            }
            if (files.length + valid.length >= MAX_FILES) {
                toast.error(`Maximum ${MAX_FILES} files allowed.`);
                break;
            }
            valid.push(f);
        }
        if (valid.length) onChange([...files, ...valid]);
    };

    const remove = (idx) => onChange(files.filter((_, i) => i !== idx));

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    return (
        <div className="space-y-3">
            {/* Drop area */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex bg-white flex-col items-center justify-center gap-2 px-6 py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${dragging ? 'border-accent-400 bg-accent-50' : 'border-neutral-200 bg-neutral-50 hover:border-accent-300 hover:bg-accent-50'}`}
            >
                <UploadIcon />
                <p className="text-sm font-medium text-text-secondary">
                    Drop files here or <span className="text-accent-500">browse</span>
                </p>
                <p className="text-xs text-text-muted">PDF or images · max 20 MB each · up to {MAX_FILES} files</p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => addFiles(Array.from(e.target.files))}
                />
            </div>

            {/* File list */}
            {files.length > 0 && (
                <ul className="space-y-2">
                    {files.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                            <FileIcon mime={f.type} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate">{f.name}</p>
                                <p className="text-xs text-text-muted">{formatBytes(f.size)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); remove(i); }}
                                className="text-text-muted hover:text-error transition-colors flex-shrink-0"
                            >
                                <XIcon />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AddAssessmentPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const { mutate: createAssessment, isPending } = useCreateAssessment(courseId);

    const [title, setTitle] = useState('');
    const [type, setType] = useState('ASSIGNMENT');
    const [instructions, setInstructions] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [files, setFiles] = useState([]);

    const canSubmit = title.trim() && !isPending;

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('type', type);
        // IMPORTANT: announcement must include Instructions:, so send instructions even if empty
        formData.append('instructions', instructions.toString());
        if (dueDate) formData.append('due_date', new Date(dueDate).toISOString());
        files.forEach((f) => formData.append('files', f));

        createAssessment(
            { formData },
            {
                onSuccess: ({ assessment, upload_errors }) => {
                    if (upload_errors?.length) {
                        toast.success('Assessment created (some files failed to upload).');
                    } else {
                        toast.success('Assessment created!');
                    }
                    navigate(`/teacher/courses/${courseId}/assessments/${assessment.id}`);
                },
                onError: (err) => {
                    const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? 'Failed to create assessment.';
                    toast.error(msg);
                },
            }
        );
    };

    return (
        <TeacherSidebar>
            <div className="max-w-3xl mx-auto pb-16 p-6">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center bg-black p-2 text-sm rounded-xl text-white font-bold gap-1.5 transition-colors mb-4 cursor-pointer"
                    >
                        <BackIcon />
                        Back
                    </button>
                    <h1 className="text-2xl font-bold text-text-primary">Add Assessment</h1>
                    <p className="text-sm text-text-secondary mt-1">Create an assessment. An announcement will be posted automatically.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-1.5">
                            Title <span className="text-error">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Midterm Exam, Problem Set 3…"
                            className="w-full bg-white px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Type toggle */}
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-1.5">
                            Type <span className="text-error">*</span>
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {TYPE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    data-active={type === opt.value}
                                    onClick={() => setType(opt.value)}
                                    className={` bg-white px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${type === opt.value
                                        ? opt.color.replace('data-[active=true]:', '')
                                        : 'border-neutral-200 text-text-secondary hover:bg-neutral-100'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-1.5">
                            Due Date <span className="text-text-muted font-normal">(optional)</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-white px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-1.5">
                            Instructions <span className="text-text-muted font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Describe what students need to do…"
                            rows={5}
                            className="w-full bg-white px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all resize-none"
                        />
                    </div>

                    {/* File upload */}
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-1.5">
                            Source Materials <span className="text-text-muted font-normal">(optional)</span>
                        </label>
                        <FileDropzone files={files} onChange={setFiles} />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-5 py-2.5 rounded-xl border border-neutral-200 text-text-secondary text-sm font-semibold hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="px-6 py-2.5 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Creating…
                                </>
                            ) : 'Create Assessment'}
                        </button>
                    </div>
                </form>
            </div>
        </TeacherSidebar>
    );
};

export default AddAssessmentPage;
