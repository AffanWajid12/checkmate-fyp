import { useState, useRef, useCallback } from 'react';
import TeacherSidebar from '../TeacherSidebar';
import apiClient from '../../../utils/apiClient';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ScanIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
);

const DownloadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = ['Configuration', 'Answer Key', 'Upload Sheets', 'Results'];

const StepIndicator = ({ current }) => (
    <div className="flex items-center gap-0 mb-10">
        {STEPS.map((label, i) => {
            const done = i < current;
            const active = i === current;
            return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                            ${done ? 'bg-accent-500 text-white' : active ? 'bg-accent-50 text-accent-500 border-2 border-accent-500' : 'bg-neutral-100 text-neutral-400'}`}>
                            {done ? <CheckIcon /> : i + 1}
                        </div>
                        <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-accent-500' : done ? 'text-accent-500' : 'text-neutral-400'}`}>
                            {label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-5 rounded ${done ? 'bg-accent-500' : 'bg-neutral-200'}`} />
                    )}
                </div>
            );
        })}
    </div>
);

// ─── Step 1: Configuration ────────────────────────────────────────────────────

const Step1 = ({ config, onChange, onNext }) => {
    const valid = config.title.trim() && config.numQuestions >= 1 && config.numQuestions <= 100;
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Assessment Title</label>
                <input
                    type="text"
                    placeholder="e.g. Midterm Exam – Biology"
                    value={config.title}
                    onChange={e => onChange({ ...config, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Number of Questions <span className="font-normal text-text-muted">(1–100)</span></label>
                <input
                    type="number"
                    min={1} max={100}
                    value={config.numQuestions}
                    onChange={e => onChange({ ...config, numQuestions: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition"
                />
            </div>
            <button
                disabled={!valid}
                onClick={onNext}
                className="w-full py-2.5 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                Continue →
            </button>
        </div>
    );
};

// ─── Step 2: Answer Key ───────────────────────────────────────────────────────

const OPTIONS = ['A', 'B', 'C', 'D'];

const Step2 = ({ numQuestions, answerKey, onChange, onNext, onBack }) => {
    const allFilled = answerKey.length === numQuestions && answerKey.every(a => a);
    return (
        <div className="space-y-6">
            <p className="text-sm text-text-secondary">Select the correct option for each question.</p>
            <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
                {Array.from({ length: numQuestions }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="w-8 text-xs font-bold text-text-muted text-right flex-shrink-0">Q{i + 1}</span>
                        <div className="flex gap-2">
                            {OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        const next = [...answerKey];
                                        next[i] = opt;
                                        onChange(next);
                                    }}
                                    className={`w-10 h-9 rounded-lg text-sm font-bold border transition-all
                                        ${answerKey[i] === opt
                                            ? 'bg-accent-500 text-white border-accent-500 shadow'
                                            : 'bg-background text-text-secondary border-neutral-200 hover:border-accent-300 hover:text-accent-500'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-3 pt-2">
                <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-text-secondary hover:bg-neutral-50 transition">← Back</button>
                <button
                    disabled={!allFilled}
                    onClick={onNext}
                    className="flex-1 py-2.5 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    Continue →
                </button>
            </div>
        </div>
    );
};

// ─── Step 3: Upload ───────────────────────────────────────────────────────────

const Step3 = ({ files, onChange, onGrade, onBack, grading }) => {
    const inputRef = useRef();

    const onDrop = useCallback(e => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        onChange(prev => [...prev, ...dropped]);
    }, [onChange]);

    const onFilePick = e => {
        const picked = Array.from(e.target.files);
        onChange(prev => [...prev, ...picked]);
        e.target.value = '';
    };

    const remove = idx => onChange(prev => prev.filter((_, i) => i !== idx));

    return (
        <div className="space-y-5">
            <div
                onDragOver={e => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => inputRef.current.click()}
                className="border-2 border-dashed border-accent-200 rounded-2xl p-10 text-center cursor-pointer hover:border-accent-400 hover:bg-accent-50/30 transition-all"
            >
                <div className="text-accent-400 flex justify-center mb-3"><UploadIcon /></div>
                <p className="text-sm font-semibold text-text-primary">Drag & drop OMR sheets here</p>
                <p className="text-xs text-text-muted mt-1">or click to browse — JPG, PNG supported</p>
                <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={onFilePick} />
            </div>

            {files.length > 0 && (
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-100">
                            <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-accent-500 text-xs font-bold">{i + 1}</span>
                            </div>
                            <span className="flex-1 text-xs text-text-primary truncate">{f.name}</span>
                            <span className="text-xs text-text-muted flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                            <button onClick={() => remove(i)} className="text-neutral-400 hover:text-red-500 transition flex-shrink-0"><TrashIcon /></button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-3">
                <button onClick={onBack} disabled={grading} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-text-secondary hover:bg-neutral-50 transition disabled:opacity-40">← Back</button>
                <button
                    disabled={files.length === 0 || grading}
                    onClick={onGrade}
                    className="flex-1 py-2.5 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                    {grading ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" /></svg>
                            Grading…
                        </>
                    ) : `Grade ${files.length} Sheet${files.length !== 1 ? 's' : ''}`}
                </button>
            </div>
        </div>
    );
};

// ─── Step 4: Results ──────────────────────────────────────────────────────────

const Step4 = ({ results, config, onReset }) => {
    if (!results) return null;

    const { processed, failed, total_questions, results: rows } = results;

    const exportCSV = () => {
        const lines = ['Filename,Score,Total,Percentage,Status'];
        rows.forEach(r => {
            if (r.status === 'success') {
                lines.push(`"${r.filename}",${r.score},${r.total},${r.percentage}%,Success`);
            } else {
                lines.push(`"${r.filename}",,,,Error: ${r.error}`);
            }
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.title || 'omr-results'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const successRows = rows.filter(r => r.status === 'success');
    const avgScore = successRows.length ? (successRows.reduce((s, r) => s + r.percentage, 0) / successRows.length).toFixed(1) : 0;

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Processed', value: processed, color: 'text-green-600 bg-green-50' },
                    { label: 'Failed', value: failed, color: 'text-red-500 bg-red-50' },
                    { label: 'Avg. Score', value: `${avgScore}%`, color: 'text-accent-500 bg-accent-50' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl p-4 text-center ${color.split(' ')[1]}`}>
                        <p className={`text-2xl font-bold ${color.split(' ')[0]}`}>{value}</p>
                        <p className="text-xs font-medium text-text-muted mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Results table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-neutral-50 text-left">
                            <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">#</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">File</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Score</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">%</th>
                            <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                                <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                                <td className="px-4 py-3 text-text-primary font-medium truncate max-w-[180px]">{r.filename}</td>
                                <td className="px-4 py-3 text-text-primary">
                                    {r.status === 'success' ? `${r.score} / ${r.total}` : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    {r.status === 'success' ? (
                                        <span className={`font-semibold ${r.percentage >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                                            {r.percentage}%
                                        </span>
                                    ) : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    {r.status === 'success' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                                            <CheckIcon /> Graded
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600" title={r.error}>
                                            Failed
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-accent-200 text-accent-500 text-sm font-semibold hover:bg-accent-50 transition"
                >
                    <DownloadIcon /> Export CSV
                </button>
                <button
                    onClick={onReset}
                    className="flex-1 py-2.5 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 transition"
                >
                    New Evaluation
                </button>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const OMREvaluationPage = () => {
    const [step, setStep] = useState(0);
    const [config, setConfig] = useState({ title: '', numQuestions: 20 });
    const [answerKey, setAnswerKey] = useState([]);
    const [files, setFiles] = useState([]);
    const [grading, setGrading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const reset = () => {
        setStep(0);
        setConfig({ title: '', numQuestions: 20 });
        setAnswerKey([]);
        setFiles([]);
        setResults(null);
        setError('');
    };

    const goToAnswerKey = () => {
        // Re-initialize answer key to match numQuestions
        setAnswerKey(prev => {
            const next = Array.from({ length: config.numQuestions }, (_, i) => prev[i] || '');
            return next;
        });
        setStep(1);
    };

    const grade = async () => {
        setGrading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('answerKey', JSON.stringify(answerKey));
            formData.append('title', config.title);
            files.forEach(f => formData.append('images', f));

            const resp = await apiClient.post(`/api/omr/evaluate`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 300000,
            });

            setResults(resp.data);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Evaluation failed');
        } finally {
            setGrading(false);
        }
    };

    return (
        <TeacherSidebar>
            <div className="max-w-3xl mx-auto p-6 pb-16">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center text-accent-500">
                            <ScanIcon />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary">OMR Evaluation</h1>
                    </div>
                    <p className="text-sm text-text-secondary">
                        Grade OMR answer sheets automatically. Define your answer key, upload scanned sheets, and get instant results.
                    </p>
                </div>

                <StepIndicator current={step} />

                <div className="bg-background border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    {error && (
                        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                            ⚠ {error}
                        </div>
                    )}

                    {step === 0 && (
                        <Step1 config={config} onChange={setConfig} onNext={goToAnswerKey} />
                    )}
                    {step === 1 && (
                        <Step2
                            numQuestions={config.numQuestions}
                            answerKey={answerKey}
                            onChange={setAnswerKey}
                            onNext={() => setStep(2)}
                            onBack={() => setStep(0)}
                        />
                    )}
                    {step === 2 && (
                        <Step3
                            files={files}
                            onChange={setFiles}
                            onGrade={grade}
                            onBack={() => setStep(1)}
                            grading={grading}
                        />
                    )}
                    {step === 3 && (
                        <Step4 results={results} config={config} onReset={reset} />
                    )}
                </div>
            </div>
        </TeacherSidebar>
    );
};

export default OMREvaluationPage;
