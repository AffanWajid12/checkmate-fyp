import React from 'react';
import { XMarkIcon } from '../../teacher/courses/CoursePage/components/Icons';

export default function DetailedResultView({ submission, assessment, onClose }) {
    const evaluation = submission.evaluation;
    if (!evaluation) return null;

    const details = evaluation.details || [];
    const structure = assessment.grading_blueprint?.structure || [];
    
    // Robust total marks calculation fallback
    const calculateMaxScore = (nodes) => {
        if (!nodes || nodes.length === 0) return 0;
        return nodes.reduce((sum, node) => {
            if (node.subparts && node.subparts.length > 0) {
                return sum + calculateMaxScore(node.subparts);
            }
            return sum + (parseFloat(node.points || node.total_marks) || 0);
        }, 0);
    };

    const maxTotalScore = assessment.grading_blueprint?.total_marks || calculateMaxScore(structure) || assessment.total_marks || 0;

    const renderFeedback = (feedback) => {
        if (!feedback) return null;
        try {
            // Attempt to parse if it's a string, or use directly if it's already an object
            const parsed = typeof feedback === 'string' ? JSON.parse(feedback) : feedback;
            
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                return <p className="text-sm text-text-secondary italic leading-relaxed">{feedback}</p>;
            }

            return (
                <div className="space-y-4">
                    {parsed.summary && (
                        <div className="mb-2">
                            <p className="text-sm font-bold text-text-primary leading-relaxed">{parsed.summary}</p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parsed.positive_points && parsed.positive_points.length > 0 && (
                            <div className="bg-success/5 border border-success/10 rounded-xl p-3">
                                <h4 className="text-[10px] font-black text-success uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    Strengths
                                </h4>
                                <ul className="space-y-1.5">
                                    {parsed.positive_points.map((p, idx) => (
                                        <li key={idx} className="text-xs text-success/80 font-medium leading-relaxed flex gap-2">
                                            <span className="shrink-0">•</span> {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {parsed.negative_points && parsed.negative_points.length > 0 && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    Weaknesses
                                </h4>
                                <ul className="space-y-1.5">
                                    {parsed.negative_points.map((p, idx) => (
                                        <li key={idx} className="text-xs text-red-600/70 font-medium leading-relaxed flex gap-2">
                                            <span className="shrink-0">•</span> {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {parsed.improvement_points && parsed.improvement_points.length > 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Improvement Suggestions
                            </h4>
                            <ul className="space-y-1.5">
                                {parsed.improvement_points.map((p, idx) => (
                                    <li key={idx} className="text-xs text-amber-700/80 font-medium leading-relaxed flex gap-2">
                                        <span className="shrink-0">→</span> {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        } catch (e) {
            return <p className="text-sm text-text-secondary italic leading-relaxed">{feedback}</p>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-neutral-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight">Detailed Evaluation</h2>
                        <p className="text-sm font-bold text-text-muted mt-1">{assessment.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-neutral-200 text-neutral-500 transition-colors"
                    >
                        <XMarkIcon size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-50/30 custom-scrollbar">
                    
                    {/* Summary Card */}
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Overall Feedback</p>
                            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                                {renderFeedback(evaluation.overall_feedback) || (
                                    <p className="text-sm text-text-muted italic">No overall feedback provided.</p>
                                )}
                            </div>
                        </div>
                        <div className="md:border-l md:border-neutral-200 md:pl-6 text-center md:text-right shrink-0 min-w-[120px]">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Score</p>
                            <p className="text-4xl font-black text-primary tracking-tighter tabular-nums">
                                {evaluation.total_score} <span className="text-xl text-neutral-300">/ {maxTotalScore}</span>
                            </p>
                        </div>
                    </div>

                    {/* Question Breakdown */}
                    <div>
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-widest mb-4 ml-1">Question Breakdown</h3>
                        <div className="space-y-4">
                            {details.length > 0 ? details.map((d, idx) => {
                                // Match with structure if possible
                                const qDef = structure.find(q => q.label === d.label || q.id === d.label);
                                const qText = d.question_text || qDef?.text || `Question ${d.label}`;
                                const isPerfect = parseFloat(d.score) === parseFloat(d.points);

                                return (
                                    <div key={idx} className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${isPerfect ? 'border-success/20 shadow-success/5' : 'border-neutral-200'}`}>
                                        <div className="flex justify-between items-start mb-4 gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-xs font-black bg-neutral-900 text-white px-2.5 py-1 rounded-full uppercase tracking-widest">
                                                        Q {d.label}
                                                    </span>
                                                    {d.type && <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{d.type}</span>}
                                                </div>
                                                <p className="text-sm font-bold text-text-secondary leading-snug">{qText}</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl border flex items-center justify-center shrink-0 min-w-[80px] ${isPerfect ? 'bg-success/5 border-success/20 text-success' : 'bg-neutral-50 border-neutral-200 text-text-primary'}`}>
                                                <span className="text-lg font-black">{d.score}</span>
                                                <span className="text-xs font-bold opacity-50 ml-1">/ {d.points}</span>
                                            </div>
                                        </div>

                                        {d.feedback && (
                                            <div className="mt-4 pt-4 border-t border-neutral-100">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Feedback Details</p>
                                                {renderFeedback(d.feedback)}
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-text-muted italic bg-white p-6 rounded-2xl border border-neutral-200 text-center">
                                    No granular feedback available for this assessment.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
