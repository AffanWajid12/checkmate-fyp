import React from 'react';

const XMarkIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function StudentInsightView({ insight, assessment, onClose }) {
    if (!insight) return null;

    const { marks_obtained, total_marks, class_average, question_breakdown, weak_topics, llm_insight } = insight;
    const pct = total_marks > 0 ? ((marks_obtained / total_marks) * 100).toFixed(1) : 0;
    const avgPct = total_marks > 0 ? ((class_average / total_marks) * 100).toFixed(1) : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-neutral-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight">Your Insights</h2>
                        <p className="text-sm font-bold text-text-muted mt-1">{assessment?.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-neutral-200 text-neutral-500 transition-colors"
                    >
                        <XMarkIcon size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50/30 custom-scrollbar">
                    {/* Score Cards Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 text-center shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Your Score</p>
                            <p className="text-3xl font-black text-primary tracking-tight tabular-nums">
                                {marks_obtained}
                                <span className="text-lg text-neutral-300 ml-1">/ {total_marks}</span>
                            </p>
                            <p className="text-xs font-bold text-neutral-400 mt-1">{pct}%</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 text-center shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Class Average</p>
                            <p className="text-3xl font-black text-neutral-700 tracking-tight tabular-nums">
                                {class_average}
                                <span className="text-lg text-neutral-300 ml-1">/ {total_marks}</span>
                            </p>
                            <p className="text-xs font-bold text-neutral-400 mt-1">{avgPct}%</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 text-center shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">vs Class</p>
                            {(() => {
                                const diff = marks_obtained - class_average;
                                const isAbove = diff >= 0;
                                return (
                                    <p className={`text-3xl font-black tracking-tight tabular-nums ${isAbove ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {isAbove ? '+' : ''}{diff.toFixed(1)}
                                    </p>
                                );
                            })()}
                            <p className="text-xs font-bold text-neutral-400 mt-1">
                                {marks_obtained >= class_average ? 'Above average' : 'Below average'}
                            </p>
                        </div>
                    </div>

                    {/* Question Breakdown */}
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-neutral-100">
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Question Breakdown</h3>
                        </div>
                        <div className="divide-y divide-neutral-50">
                            {question_breakdown?.map((q, i) => {
                                const qPct = q.max_points > 0 ? (q.score / q.max_points) * 100 : 0;
                                const barColor = qPct >= 80 ? 'bg-emerald-400' : qPct >= 60 ? 'bg-amber-400' : 'bg-red-400';
                                return (
                                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-neutral-50/50 transition-colors">
                                        <span className="text-[10px] font-black bg-neutral-900 text-white px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0">
                                            {q.label}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-text-secondary truncate">{q.topic || q.question_text}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="w-20 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${Math.min(qPct, 100)}%` }} />
                                            </div>
                                            <span className="text-sm font-black text-text-primary tabular-nums w-16 text-right">
                                                {q.score}<span className="text-neutral-300 font-bold">/{q.max_points}</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Weak Topics */}
                    {weak_topics?.length > 0 && (
                        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Topics to Focus On
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {weak_topics.map((t, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LLM Personalised Insight */}
                    {llm_insight && (
                        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-6">
                            <h3 className="text-sm font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                AI Personalised Insight
                            </h3>
                            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium whitespace-pre-line">
                                {llm_insight}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
