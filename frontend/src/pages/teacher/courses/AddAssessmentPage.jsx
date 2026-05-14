import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateAssessment, useSaveTestCases, useGenerateTestCases } from '../../../hooks/useCourses';
import TeacherSidebar from '../TeacherSidebar';
import { v4 as uuidv4 } from 'uuid';

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

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const SparklesIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
        <path d="M12 3v4M3 12h4M17 12h4M12 17v4M5.64 5.64l2.83 2.83M15.54 8.46l2.83-2.83M5.64 18.36l2.83-2.83M15.54 15.54l2.83 2.83" />
    </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 10;

const TYPE_OPTIONS = [
    { value: 'QUIZ', label: 'Quiz', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { value: 'ASSIGNMENT', label: 'Assignment', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { value: 'EXAM', label: 'Exam', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { value: 'CODING', label: 'Coding', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
];

// ─── File Dropzone ────────────────────────────────────────────────────────────

const FileDropzone = ({ files, onChange }) => {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const addFiles = (incoming) => {
        const valid = [];
        for (const f of incoming) {
            if (!ALLOWED_TYPES.includes(f.type)) { toast.error(`"${f.name}" is not a PDF or image.`); continue; }
            if (f.size > MAX_SIZE_BYTES) { toast.error(`"${f.name}" exceeds 20 MB.`); continue; }
            if (files.length + valid.length >= MAX_FILES) { toast.error(`Maximum ${MAX_FILES} files allowed.`); break; }
            valid.push(f);
        }
        if (valid.length) onChange([...files, ...valid]);
    };

    const remove = (idx) => onChange(files.filter((_, i) => i !== idx));

    return (
        <div className="space-y-3">
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
                onClick={() => inputRef.current?.click()}
                className={`flex bg-white flex-col items-center justify-center gap-2 px-6 py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${dragging ? 'border-accent-400 bg-accent-50' : 'border-neutral-200 bg-neutral-50 hover:border-accent-300 hover:bg-accent-50'}`}
            >
                <UploadIcon />
                <p className="text-sm font-medium text-text-secondary">Drop files here or <span className="text-accent-500">browse</span></p>
                <p className="text-xs text-text-muted">PDF or images · max 20 MB each · up to {MAX_FILES} files</p>
                <input ref={inputRef} type="file" multiple accept=".pdf,image/*" className="hidden" onChange={(e) => addFiles(Array.from(e.target.files))} />
            </div>
            {files.length > 0 && (
                <ul className="space-y-2">
                    {files.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                            <FileIcon mime={f.type} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate">{f.name}</p>
                                <p className="text-xs text-text-muted">{formatBytes(f.size)}</p>
                            </div>
                            <button type="button" onClick={(e) => { e.stopPropagation(); remove(i); }} className="text-text-muted hover:text-error transition-colors flex-shrink-0">
                                <XIcon />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ─── Test Case Row ────────────────────────────────────────────────────────────

const TestCaseRow = ({ tc, index, onChange, onRemove }) => (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Test Case {index + 1}</span>
            <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={tc.is_hidden}
                        onChange={(e) => onChange({ ...tc, is_hidden: e.target.checked })}
                        className="w-4 h-4 rounded accent-emerald-600"
                    />
                    Hidden
                </label>
                <button type="button" onClick={onRemove} className="text-text-muted hover:text-error transition-colors">
                    <XIcon />
                </button>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Input (stdin)</label>
                <textarea
                    value={tc.input}
                    onChange={(e) => onChange({ ...tc, input: e.target.value })}
                    rows={3}
                    placeholder="e.g. 5\n3"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Expected Output</label>
                <textarea
                    value={tc.expected_output}
                    onChange={(e) => onChange({ ...tc, expected_output: e.target.value })}
                    rows={3}
                    placeholder="e.g. 8"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
            </div>
        </div>
    </div>
);

// ─── Coding Config Panel ──────────────────────────────────────────────────────

const CodingConfigPanel = ({ language, setLanguage, totalMarks, setTotalMarks, testCases, setTestCases, instructions, assessmentId, courseId }) => {
    const [genCount, setGenCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const { mutateAsync: generateTCs } = useGenerateTestCases(courseId, assessmentId || 'temp');

    const addTestCase = () => {
        setTestCases([...testCases, { id: uuidv4(), input: '', expected_output: '', is_hidden: false }]);
    };

    const updateTestCase = (idx, updated) => {
        setTestCases(testCases.map((tc, i) => i === idx ? updated : tc));
    };

    const removeTestCase = (idx) => {
        setTestCases(testCases.filter((_, i) => i !== idx));
    };

    const handleGenerate = async () => {
        if (!instructions.trim()) {
            toast.error('Add problem instructions first so the AI knows what test cases to generate.');
            return;
        }
        setIsGenerating(true);
        try {
            // If no assessmentId yet (assessment not created), call generate endpoint with a placeholder
            // The backend generate-test-cases endpoint only needs the question, not a real DB record
            const result = await generateTCs({ question: instructions, language, count: genCount });
            const newCases = (result.test_cases || []).map(tc => ({ ...tc, id: tc.id || uuidv4() }));
            setTestCases([...testCases, ...newCases]);
            toast.success(`Generated ${newCases.length} test cases!`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'AI generation failed. Is the code-grader service running?');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Language + Marks */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1.5">Language <span className="text-error">*</span></label>
                    <div className="flex gap-2">
                        {['python', 'javascript'].map(lang => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setLanguage(lang)}
                                className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${language === lang ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white border-neutral-200 text-text-secondary hover:bg-neutral-100'}`}
                            >
                                {lang === 'python' ? '🐍 Python' : '🟨 JavaScript'}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1.5">Total Marks</label>
                    <input
                        type="number"
                        min={1}
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(e.target.value)}
                        className="w-full bg-white px-4 py-2.5 rounded-xl border border-neutral-200 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Test Cases Header */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-text-primary">
                        Test Cases <span className="text-error">*</span>
                        <span className="ml-2 text-xs font-normal text-text-muted">({testCases.length} added)</span>
                    </label>
                    <button
                        type="button"
                        onClick={addTestCase}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                        <PlusIcon /> Add manually
                    </button>
                </div>

                {/* AI Generation Row */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <SparklesIcon />
                    <span className="text-xs font-semibold text-emerald-700 flex-1">Generate with AI</span>
                    <input
                        type="number"
                        min={1} max={20}
                        value={genCount}
                        onChange={(e) => setGenCount(Number(e.target.value))}
                        className="w-14 text-center text-sm rounded-xl border border-emerald-200 bg-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="text-xs text-emerald-600">cases</span>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {isGenerating ? (
                            <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Generating…</>
                        ) : <><SparklesIcon />Generate</>}
                    </button>
                </div>

                {/* Test Case List */}
                {testCases.length === 0 ? (
                    <div className="text-center py-8 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50">
                        <p className="text-sm text-text-muted">No test cases yet. Add manually or generate with AI.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {testCases.map((tc, i) => (
                            <TestCaseRow
                                key={tc.id}
                                tc={tc}
                                index={i}
                                onChange={(updated) => updateTestCase(i, updated)}
                                onRemove={() => removeTestCase(i)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AddAssessmentPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const { mutate: createAssessment, isPending } = useCreateAssessment(courseId);
    const { mutateAsync: saveTestCases, isPending: isSavingTCs } = useSaveTestCases(courseId, '');

    const [title, setTitle] = useState('');
    const [type, setType] = useState('ASSIGNMENT');
    const [instructions, setInstructions] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [files, setFiles] = useState([]);

    // Coding-specific state
    const [language, setLanguage] = useState('python');
    const [totalMarks, setTotalMarks] = useState(10);
    const [testCases, setTestCases] = useState([]);

    const isCoding = type === 'CODING';
    const canSubmit = title.trim() && !isPending && !isSavingTCs &&
        (!isCoding || testCases.length > 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isCoding && testCases.length === 0) {
            toast.error('Add at least one test case for a Coding assessment.');
            return;
        }

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('type', type);
        formData.append('instructions', instructions.toString());
        if (dueDate) formData.append('due_date', new Date(dueDate).toISOString());
        if (!isCoding) {
            files.forEach((f) => formData.append('files', f));
        }

        createAssessment(
            { formData },
            {
                onSuccess: async ({ assessment }) => {
                    if (isCoding) {
                        // Save test cases to the newly created assessment
                        try {
                            const { mutateAsync: saveTCs } = { mutateAsync: async (payload) => {
                                const { data } = await import('../../../utils/apiClient.js').then(m => m.default.post(
                                    `/api/courses/${courseId}/assessments/${assessment.id}/test-cases`,
                                    payload
                                ));
                                return data;
                            }};
                            // Use apiClient directly here since we need the assessmentId dynamically
                            const apiClient = (await import('../../../utils/apiClient.js')).default;
                            await apiClient.post(
                                `/api/courses/${courseId}/assessments/${assessment.id}/test-cases`,
                                { language, test_cases: testCases, total_marks: totalMarks }
                            );
                            toast.success('Coding assessment created with test cases!');
                        } catch {
                            toast.success('Assessment created (test cases save failed — retry from edit).');
                        }
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
                                    onClick={() => setType(opt.value)}
                                    className={`bg-white px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${type === opt.value ? opt.color : 'border-neutral-200 text-text-secondary hover:bg-neutral-100'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {isCoding && (
                            <p className="text-xs text-emerald-600 mt-2 font-medium">
                                Students will submit <code className="font-mono bg-emerald-50 px-1 rounded">.py</code> or <code className="font-mono bg-emerald-50 px-1 rounded">.js</code> files and run test cases directly.
                            </p>
                        )}
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
                            {isCoding ? 'Problem Statement' : 'Instructions'} <span className="text-text-muted font-normal">{isCoding ? '' : '(optional)'}</span>
                        </label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder={isCoding
                                ? 'Describe the coding problem clearly (used for AI test case generation too)…'
                                : 'Describe what students need to do…'
                            }
                            rows={5}
                            className="w-full bg-white px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all resize-none"
                        />
                    </div>

                    {/* Conditional: file upload OR coding config */}
                    {isCoding ? (
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-emerald-700 mb-4 flex items-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                                </svg>
                                Coding Configuration
                            </h3>
                            <CodingConfigPanel
                                language={language}
                                setLanguage={setLanguage}
                                totalMarks={totalMarks}
                                setTotalMarks={setTotalMarks}
                                testCases={testCases}
                                setTestCases={setTestCases}
                                instructions={instructions}
                                assessmentId={null}
                                courseId={courseId}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-1.5">
                                Source Materials <span className="text-text-muted font-normal">(optional)</span>
                            </label>
                            <FileDropzone files={files} onChange={setFiles} />
                        </div>
                    )}

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
                            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${isCoding ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-primary text-text-inverse hover:bg-primary-hover'}`}
                        >
                            {isPending || isSavingTCs ? (
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
