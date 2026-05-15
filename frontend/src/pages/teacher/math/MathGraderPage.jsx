import { useState } from 'react';
import TeacherSidebar from '../TeacherSidebar';
import apiClient from '../../../utils/apiClient';

// ─── Icons ────────────────────────────────────────────────────────────────────

const MathIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M4 7h16M4 12h10M4 17h7" />
        <path d="M16 14l2 2 4-4" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
);

const ChevronIcon = ({ open }) => (
    <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// ─── Score Badge ──────────────────────────────────────────────────────────────

const ScoreBadge = ({ score }) => {
    if (score === undefined || score === null) return null;
    const pct = typeof score === 'number' ? score : parseFloat(score);
    const color = pct >= 70
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : pct >= 40
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-red-50 text-red-600 border-red-200';
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${color}`}>
            Score: {pct}
        </span>
    );
};

// ─── Collapsible Section ──────────────────────────────────────────────────────

const Section = ({ title, badge, children, defaultOpen = false, accent }) => {
    const [open, setOpen] = useState(defaultOpen);

    const accentMap = {
        purple: 'border-violet-200 bg-violet-50/40',
        blue:   'border-blue-200 bg-blue-50/40',
        orange: 'border-orange-200 bg-orange-50/40',
    };
    const headerMap = {
        purple: 'text-violet-700',
        blue:   'text-blue-700',
        orange: 'text-orange-700',
    };
    const dotMap = {
        purple: 'bg-violet-400',
        blue:   'bg-blue-400',
        orange: 'bg-orange-400',
    };

    return (
        <div className={`rounded-2xl border ${accentMap[accent] || 'border-neutral-200 bg-neutral-50'} overflow-hidden`}>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${dotMap[accent] || 'bg-neutral-400'}`} />
                    <span className={`font-bold text-sm ${headerMap[accent] || 'text-text-primary'}`}>{title}</span>
                    {badge}
                </div>
                <ChevronIcon open={open} />
            </button>
            {open && (
                <div className="px-5 pb-5 pt-1 border-t border-black/[0.04]">
                    {children}
                </div>
            )}
        </div>
    );
};

// ─── Reasoning Text ───────────────────────────────────────────────────────────

const ReasoningText = ({ text }) => (
    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap mt-3">{text}</p>
);

// ─── Step List ────────────────────────────────────────────────────────────────

const StepList = ({ data }) => {
    // data may be { steps: [...] } or { step_1: {...}, step_2: {...} } or similar
    const entries = Object.entries(data);

    // If there's a top-level "steps" array
    if (Array.isArray(data.steps)) {
        return (
            <ol className="mt-3 space-y-3">
                {data.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                        </span>
                        <div className="flex-1">
                            {typeof step === 'string' ? (
                                <p className="text-sm text-text-secondary">{step}</p>
                            ) : (
                                <JsonTree data={step} depth={0} />
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        );
    }

    return <JsonTree data={data} depth={0} />;
};

// ─── Generic JSON Tree renderer ───────────────────────────────────────────────

const JsonTree = ({ data, depth = 0 }) => {
    if (data === null || data === undefined) return <span className="text-text-muted italic text-xs">null</span>;

    if (typeof data === 'boolean') return <span className={`text-xs font-semibold ${data ? 'text-emerald-600' : 'text-red-500'}`}>{String(data)}</span>;

    if (typeof data === 'number') return <span className="text-xs font-bold text-violet-700">{data}</span>;

    if (typeof data === 'string') return <span className="text-sm text-text-secondary leading-relaxed">{data}</span>;

    if (Array.isArray(data)) {
        return (
            <ol className="mt-1 space-y-2 list-decimal list-inside">
                {data.map((item, i) => (
                    <li key={i} className="text-sm text-text-secondary">
                        <JsonTree data={item} depth={depth + 1} />
                    </li>
                ))}
            </ol>
        );
    }

    // Object
    return (
        <div className={`space-y-2 ${depth > 0 ? 'ml-3 pl-3 border-l-2 border-neutral-200' : ''}`}>
            {Object.entries(data).map(([key, val]) => {
                const isScoreKey = key.toLowerCase().includes('score');
                const isReasonKey = key.toLowerCase().includes('reason') || key.toLowerCase().includes('feedback') || key.toLowerCase().includes('comment');
                return (
                    <div key={key}>
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wide block mb-1">
                            {key.replace(/_/g, ' ')}
                        </span>
                        {isScoreKey && typeof val === 'number' ? (
                            <div className="flex items-center gap-2">
                                <ScoreBadge score={val} />
                            </div>
                        ) : (
                            <JsonTree data={val} depth={depth + 1} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ─── Results Display ──────────────────────────────────────────────────────────

const ResultsDisplay = ({ data, onReset }) => {
    const { overall, stepwise, subtle_errors } = data;

    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'math-grading-result.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-text-primary">Grading Results</h2>
                <div className="flex gap-2">
                    <button
                        onClick={exportJSON}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-text-secondary hover:bg-neutral-50 transition"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export JSON
                    </button>
                    <button
                        onClick={onReset}
                        className="px-3 py-1.5 rounded-lg bg-accent-500 text-white text-xs font-semibold hover:bg-accent-600 transition"
                    >
                        New Evaluation
                    </button>
                </div>
            </div>

            {/* Overall */}
            {overall && (
                <Section
                    title="Overall Assessment"
                    defaultOpen
                    accent="purple"
                    badge={<ScoreBadge score={overall.overall_score} />}
                >
                    {overall.reasoning && <ReasoningText text={overall.reasoning} />}
                    {/* Show any other fields in overall besides overall_score and reasoning */}
                    {Object.entries(overall)
                        .filter(([k]) => k !== 'overall_score' && k !== 'reasoning')
                        .length > 0 && (
                        <div className="mt-3">
                            <JsonTree data={Object.fromEntries(
                                Object.entries(overall).filter(([k]) => k !== 'overall_score' && k !== 'reasoning')
                            )} depth={0} />
                        </div>
                    )}
                </Section>
            )}

            {/* Stepwise */}
            {stepwise && (
                <Section
                    title="Step-by-Step Breakdown"
                    accent="blue"
                    badge={stepwise.overall_score !== undefined ? <ScoreBadge score={stepwise.overall_score} /> : null}
                >
                    <StepList data={stepwise} />
                </Section>
            )}

            {/* Subtle errors */}
            {subtle_errors && (
                <Section
                    title="Subtle Error Analysis"
                    accent="orange"
                    badge={subtle_errors.overall_score !== undefined ? <ScoreBadge score={subtle_errors.overall_score} /> : null}
                >
                    <JsonTree data={subtle_errors} depth={0} />
                </Section>
            )}

            {/* Raw JSON fallback: show any top-level keys not already handled */}
            {Object.entries(data)
                .filter(([k]) => !['overall', 'stepwise', 'subtle_errors'].includes(k))
                .length > 0 && (
                <Section title="Additional Data" accent="blue">
                    <JsonTree
                        data={Object.fromEntries(
                            Object.entries(data).filter(([k]) => !['overall', 'stepwise', 'subtle_errors'].includes(k))
                        )}
                        depth={0}
                    />
                </Section>
            )}

            {/* Full raw JSON viewer */}
            <details className="rounded-xl border border-neutral-200 overflow-hidden">
                <summary className="px-4 py-3 text-xs font-semibold text-text-muted cursor-pointer hover:bg-neutral-50 transition select-none">
                    View Raw JSON Response
                </summary>
                <pre className="px-4 pb-4 pt-2 text-xs text-text-secondary bg-neutral-50 overflow-x-auto max-h-80 leading-relaxed">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </details>
        </div>
    );
};

// ─── Input Form ───────────────────────────────────────────────────────────────

const INITIAL_FORM = {
    rubric: '',
    question: '',
    model_solution: '',
    student_solution: '',
};

const TextArea = ({ label, hint, value, onChange, placeholder, rows = 4 }) => (
    <div>
        <label className="block text-sm font-semibold text-text-primary mb-1">
            {label}
            {hint && <span className="ml-1.5 text-xs font-normal text-text-muted">{hint}</span>}
        </label>
        <textarea
            rows={rows}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-background text-text-primary text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-400 transition placeholder:text-text-muted"
        />
    </div>
);

const GradeForm = ({ form, onChange, onSubmit, loading, error }) => {
    const allFilled = Object.values(form).every(v => v.trim());
    return (
        <div className="space-y-5">
            <TextArea
                label="Rubric"
                hint="(grading criteria / marking scheme)"
                value={form.rubric}
                onChange={e => onChange({ ...form, rubric: e.target.value })}
                placeholder="e.g. Award full marks for correct use of integration by parts. Partial credit for correct choice of u and dv."
                rows={3}
            />
            <TextArea
                label="Question"
                hint="(the math problem)"
                value={form.question}
                onChange={e => onChange({ ...form, question: e.target.value })}
                placeholder="e.g. Evaluate ∫ x·e^(−x) dx using integration by parts."
                rows={3}
            />
            <TextArea
                label="Model Solution"
                hint="(reference / expected answer)"
                value={form.model_solution}
                onChange={e => onChange({ ...form, model_solution: e.target.value })}
                placeholder="Let u = x, dv = e^(−x) dx → v = −e^(−x) ..."
                rows={5}
            />
            <TextArea
                label="Student Solution"
                hint="(submitted answer to grade)"
                value={form.student_solution}
                onChange={e => onChange({ ...form, student_solution: e.target.value })}
                placeholder="Paste the student's handwritten or typed solution here..."
                rows={5}
            />

            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                    ⚠ {error}
                </div>
            )}

            <button
                disabled={!allFilled || loading}
                onClick={onSubmit}
                className="w-full py-3 rounded-xl bg-accent-500 text-white font-bold text-sm hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <SpinnerIcon />
                        Grading…
                    </>
                ) : 'Grade Solution'}
            </button>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const MathGraderPage = () => {
    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const reset = () => {
        setForm(INITIAL_FORM);
        setResults(null);
        setError('');
    };

    const submit = async () => {
        setLoading(true);
        setError('');
        try {
            const resp = await apiClient.post('/api/math/grade', {
                rubric: form.rubric.trim(),
                question: form.question.trim(),
                model_solution: form.model_solution.trim(),
                student_solution: form.student_solution.trim(),
            });
            setResults(resp.data);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.details || err.message || 'Grading failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TeacherSidebar>
            <div className="max-w-3xl mx-auto p-6 pb-16">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                            <MathIcon />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary">Math Grader</h1>
                    </div>
                    <p className="text-sm text-text-secondary">
                        Automatically grade a student's math solution using AI. Provide the rubric, question,
                        model answer, and the student's answer — the system will run an overall assessment,
                        step-by-step breakdown, and subtle error analysis.
                    </p>
                </div>

                <div className="bg-background border border-neutral-200 rounded-2xl p-6 shadow-sm">
                    {results ? (
                        <ResultsDisplay data={results} onReset={reset} />
                    ) : (
                        <GradeForm
                            form={form}
                            onChange={setForm}
                            onSubmit={submit}
                            loading={loading}
                            error={error}
                        />
                    )}
                </div>
            </div>
        </TeacherSidebar>
    );
};

export default MathGraderPage;
