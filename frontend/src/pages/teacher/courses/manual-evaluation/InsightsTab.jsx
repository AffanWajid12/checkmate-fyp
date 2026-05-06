import React, { useState } from 'react';
import { useGenerateInsights, useGetInsights } from '../../../../hooks/useCourses';
import toast from 'react-hot-toast';

// ─── Tiny SVG Bar Chart ──────────────────────────────────────────────────────

const BarChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.max_points), 1);

    return (
        <div className="flex items-end gap-3 h-52 px-2 pt-4">
            {data.map((d, i) => {
                const avgPct = (d.avg_score / maxVal) * 100;
                const maxPct = (d.max_points / maxVal) * 100;
                const ratio = d.max_points > 0 ? d.avg_score / d.max_points : 0;
                const barColor = ratio >= 0.8 ? 'bg-emerald-400' : ratio >= 0.6 ? 'bg-amber-400' : 'bg-red-400';

                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
                            {d.topic || d.label}: {d.avg_score.toFixed(1)}/{d.max_points}
                        </div>
                        <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '100%' }}>
                            <span className="text-[9px] font-black text-neutral-400 mb-1">{d.avg_score.toFixed(1)}</span>
                            <div className="w-full flex-1 relative rounded-t-lg overflow-hidden bg-neutral-100">
                                {/* Max bar (full height reference) */}
                                <div
                                    className="absolute bottom-0 w-full bg-neutral-100 rounded-t-lg transition-all"
                                    style={{ height: `${maxPct}%` }}
                                />
                                {/* Avg bar */}
                                <div
                                    className={`absolute bottom-0 w-full ${barColor} rounded-t-lg transition-all duration-500 ease-out`}
                                    style={{ height: `${avgPct}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-neutral-500 mt-1 truncate max-w-full">{d.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function InsightsTab({ courseId, assessment, onBack }) {
    const assessmentId = assessment?.id;
    const { data: insightData, isLoading, isError, error } = useGetInsights(courseId, assessmentId);
    const { mutateAsync: generate, isPending: generating } = useGenerateInsights(courseId, assessmentId);
    const [threshold, setThreshold] = useState(0.6);

    const handleGenerate = async () => {
        try {
            await generate({ threshold });
            toast.success("Insights generated successfully!");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to generate insights.");
        }
    };

    const teacherData = insightData?.teacher_data;
    const hasInsights = !!teacherData;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">Assessment Insights</h2>
                    <p className="text-sm text-text-muted mt-1 font-bold">
                        Analytics and AI-powered analysis for <span className="text-primary">{assessment?.title}</span>
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    {/* Threshold control */}
                    <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Threshold</label>
                        <select
                            value={threshold}
                            onChange={(e) => setThreshold(parseFloat(e.target.value))}
                            className="text-xs font-bold bg-transparent border-none outline-none text-text-primary cursor-pointer"
                        >
                            <option value={0.5}>50%</option>
                            <option value={0.6}>60%</option>
                            <option value={0.7}>70%</option>
                            <option value={0.8}>80%</option>
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-5 py-2.5 bg-neutral-900 text-white font-black rounded-xl text-xs hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-black/10"
                    >
                        {generating ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Generating…
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                {hasInsights ? 'Regenerate' : 'Generate'} Insights
                            </>
                        )}
                    </button>
                    <button
                        onClick={onBack}
                        className="px-4 py-2.5 bg-white border border-neutral-200 text-text-primary rounded-xl text-xs font-black hover:bg-neutral-50 transition-all"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* Loading / Empty / Error */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-pulse text-sm font-bold text-neutral-400">Loading insights…</div>
                </div>
            )}

            {!isLoading && !hasInsights && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-neutral-100 flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-text-primary">No Insights Yet</h3>
                    <p className="text-sm text-text-muted mt-2 max-w-xs">Grade at least one submission, then click "Generate Insights" to view analytics.</p>
                </div>
            )}

            {/* ─── Insights Content ─── */}
            {!isLoading && hasInsights && (
                <div className="space-y-6">
                    {/* Generated timestamp */}
                    {insightData.generated_at && (
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                            Last generated: {new Date(insightData.generated_at).toLocaleString()}
                        </p>
                    )}

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Class Average', value: teacherData.class_average, suffix: `/ ${teacherData.total_marks}`, color: 'text-primary' },
                            { label: 'Graded', value: teacherData.graded_count, suffix: 'students', color: 'text-emerald-600' },
                            { label: 'Total Marks', value: teacherData.total_marks, suffix: '', color: 'text-text-primary' },
                            { label: 'Weak Topics', value: teacherData.weak_topics?.length || 0, suffix: 'identified', color: teacherData.weak_topics?.length > 0 ? 'text-red-500' : 'text-emerald-600' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">{s.label}</p>
                                <p className={`text-2xl font-black ${s.color} tracking-tight`}>
                                    {s.value} {s.suffix && <span className="text-sm font-bold text-neutral-300">{s.suffix}</span>}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Per-Question Bar Chart */}
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-1">Average Per Question</h3>
                        <p className="text-xs text-text-muted mb-4">Hover over bars to see topic details</p>
                        <BarChart data={teacherData.question_averages} />
                        {/* Legend */}
                        <div className="flex gap-4 mt-4 justify-center">
                            {[
                                { label: '≥ 80%', color: 'bg-emerald-400' },
                                { label: '60–79%', color: 'bg-amber-400' },
                                { label: '< 60%', color: 'bg-red-400' },
                            ].map((l, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                                    <span className="text-[10px] font-bold text-neutral-500">{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weak Topics */}
                    {teacherData.weak_topics?.length > 0 && (
                        <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
                            <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Topics Needing More Focus
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {teacherData.weak_topics.map((t, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-600">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LLM Class Summary */}
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-6">
                        <h3 className="text-sm font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            AI Class Performance Summary
                        </h3>
                        <p className="text-sm text-indigo-900/80 leading-relaxed font-medium whitespace-pre-line">
                            {teacherData.llm_summary}
                        </p>
                    </div>

                    {/* Student Breakdown Table */}
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-neutral-100">
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Student Breakdown</h3>
                            <p className="text-xs text-text-muted mt-1">Scores of all graded students</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-100">
                                        <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">#</th>
                                        <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Student</th>
                                        <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Marks</th>
                                        <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Percentage</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teacherData.student_breakdown
                                        ?.sort((a, b) => b.marks_obtained - a.marks_obtained)
                                        .map((s, i) => {
                                            const pct = s.total_marks > 0 ? ((s.marks_obtained / s.total_marks) * 100).toFixed(1) : 0;
                                            const barColor = pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400';
                                            return (
                                                <tr key={s.student_id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                                                    <td className="p-4 font-bold text-neutral-400">{i + 1}</td>
                                                    <td className="p-4 font-bold text-text-primary">{s.name}</td>
                                                    <td className="p-4 text-right font-black text-text-primary tabular-nums">
                                                        {s.marks_obtained} <span className="text-neutral-300 font-bold">/ {s.total_marks}</span>
                                                    </td>
                                                    <td className="p-4 text-right font-bold text-text-secondary">{pct}%</td>
                                                    <td className="p-4">
                                                        <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                                            <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
