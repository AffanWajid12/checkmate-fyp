import React, { useState, useEffect } from 'react';
import { useSaveEvaluation } from '../../../../hooks/useCourses';
import toast from 'react-hot-toast';

const GradingNode = ({ node, questionGrades, onScoreChange, onFeedbackChange, depth = 0 }) => {
    const hasSubparts = node.subparts && node.subparts.length > 0;
    const label = node.label || node.id;
    const g = questionGrades[label] || { score: 0, feedback: '' };

    return (
        <div className={`space-y-4 ${depth > 0 ? 'ml-6 mt-4 pl-4 border-l-2 border-neutral-100' : ''}`}>
            <div className={`bg-white border rounded-2xl p-5 transition-all ${depth === 0 ? 'border-neutral-200 shadow-sm' : 'border-neutral-100 bg-neutral-50/30'}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${hasSubparts ? 'bg-neutral-100 text-neutral-400' : 'bg-neutral-900 text-white'}`}>
                                {label}
                            </span>
                            {node.type && !hasSubparts && <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{node.type}</span>}
                            {hasSubparts && <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">Section</span>}
                        </div>
                        <p className={`font-bold leading-relaxed ${hasSubparts ? 'text-lg text-text-primary' : 'text-sm text-text-secondary'}`}>
                            {node.question_text || node.text || label}
                        </p>
                    </div>

                    {!hasSubparts && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ml-4 ${parseFloat(g.score) > (node.points || node.total_marks || 0) ? 'bg-red-50 border-red-200 ring-4 ring-red-50' : 'bg-neutral-50 border-neutral-200'}`}>
                            <input
                                type="number"
                                value={g.score}
                                onChange={(e) => onScoreChange(label, e.target.value, (node.points || node.total_marks || 0))}
                                className={`w-16 text-right font-black text-lg bg-transparent outline-none focus:bg-white rounded px-1 ${parseFloat(g.score) > (node.points || node.total_marks || 0) ? 'text-red-600' : 'text-primary'}`}
                                min="0"
                                max={node.points || node.total_marks || 0}
                                step="0.5"
                            />
                            <span className={`text-sm font-bold ${parseFloat(g.score) > (node.points || node.total_marks || 0) ? 'text-red-400' : 'text-neutral-400'}`}>/ {node.points || node.total_marks || 0}</span>
                        </div>
                    )}
                </div>

                {!hasSubparts && (
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                        <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Feedback & Notes</label>
                        <textarea
                            value={g.feedback}
                            onChange={(e) => onFeedbackChange(label, e.target.value)}
                            placeholder="Add specific feedback..."
                            className="w-full h-20 p-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:bg-white resize-none transition-all focus:ring-2 focus:ring-primary/5 focus:border-primary/20"
                        />
                    </div>
                )}
            </div>

            {hasSubparts && (
                <div className="space-y-4">
                    {node.subparts.map((child, idx) => (
                        <GradingNode
                            key={child.id || idx}
                            node={child}
                            questionGrades={questionGrades}
                            onScoreChange={onScoreChange}
                            onFeedbackChange={onFeedbackChange}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function GradingPanel({ courseId, assessment, submission, onEditBlueprint }) {
    const { mutateAsync: saveEvaluation, isPending } = useSaveEvaluation(courseId, assessment.id);
    const structure = assessment?.grading_blueprint?.structure || [];

    // Flatten helper for initialization and saving
    const getLeafQuestions = (nodes) => {
        let leaves = [];
        nodes.forEach(node => {
            if (node.subparts && node.subparts.length > 0) {
                leaves = [...leaves, ...getLeafQuestions(node.subparts)];
            } else {
                leaves.push(node);
            }
        });
        return leaves;
    };

    const leafQuestions = getLeafQuestions(structure);
    const maxTotalScore = assessment?.grading_blueprint?.total_marks || 0;

    const [overallFeedback, setOverallFeedback] = useState('');
    const [questionGrades, setQuestionGrades] = useState({});

    useEffect(() => {
        if (submission?.evaluation) {
            setOverallFeedback(submission.evaluation.overall_feedback || '');
            const details = submission.evaluation.details || [];
            const newGrades = {};
            details.forEach(d => {
                newGrades[d.label] = { score: d.score || 0, feedback: d.feedback || '' };
            });
            setQuestionGrades(newGrades);
        } else {
            setOverallFeedback('');
            const newGrades = {};
            leafQuestions.forEach(q => {
                newGrades[q.label || q.id] = { score: 0, feedback: '' };
            });
            setQuestionGrades(newGrades);
        }
    }, [submission, structure]);

    const currentTotalScore = Object.values(questionGrades).reduce((sum, q) => sum + (parseFloat(q.score) || 0), 0);

    const handleScoreChange = (label, val, max) => {
        const numericVal = parseFloat(val);
        if (numericVal > max) {
            toast.error(`Maximum marks for this question is ${max}`);
            // We'll set it to max but keep the UI reactive
            setQuestionGrades(prev => ({ ...prev, [label]: { ...prev[label], score: max } }));
        } else {
            setQuestionGrades(prev => ({ ...prev, [label]: { ...prev[label], score: val } }));
        }
    };

    const handleFeedbackChange = (label, val) => {
        setQuestionGrades(prev => ({ ...prev, [label]: { ...prev[label], feedback: val } }));
    };

    const handleSave = async () => {
        try {
            const details = leafQuestions.map(q => {
                const label = q.label || q.id;
                const g = questionGrades[label] || {};
                return {
                    label: label,
                    points: q.points || q.total_marks || 0,
                    question_text: q.question_text || q.text || q.label,
                    type: q.type || 'manual',
                    score: parseFloat(g.score) || 0,
                    feedback: g.feedback || ''
                };
            });

            const isPlaceholder = submission.id.startsWith('placeholder-');

            await saveEvaluation({
                submissionId: isPlaceholder ? 'new' : submission.id,
                studentId: isPlaceholder ? submission.user_id : undefined,
                total_score: currentTotalScore,
                overall_feedback: overallFeedback,
                details: details
            });
            toast.success("Evaluation saved successfully!");
        } catch (error) {
            toast.error("Failed to save evaluation.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-8 border-b border-neutral-200 flex justify-between items-start bg-neutral-50/50">
                <div className="flex-1">
                    <h3 className="text-2xl font-black text-text-primary tracking-tight">Grading Panel</h3>
                    <p className="text-sm font-bold text-text-muted mt-1">Student: <span className="text-primary">{submission.user?.name}</span></p>
                </div>
                <div className="text-right ml-8 bg-white px-6 py-3 rounded-3xl border border-neutral-200 shadow-sm">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Score</p>
                    <p className="text-3xl font-black text-primary tracking-tighter tabular-nums">
                        {currentTotalScore} <span className="text-lg text-neutral-300">/ {maxTotalScore}</span>
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar pb-32">
                <div className="bg-white border border-neutral-200 p-6 rounded-[2rem] shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4">Overall Executive Summary</label>
                    <textarea
                        value={overallFeedback}
                        onChange={(e) => setOverallFeedback(e.target.value)}
                        placeholder="Write a comprehensive summary for the student..."
                        className="w-full h-32 p-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white resize-none transition-all"
                    />
                </div>

                <div className="space-y-8">
                    {structure.map((q, idx) => (
                        <GradingNode
                            key={q.id || idx}
                            node={q}
                            questionGrades={questionGrades}
                            onScoreChange={handleScoreChange}
                            onFeedbackChange={handleFeedbackChange}
                        />
                    ))}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-neutral-200 flex justify-end shadow-2xl">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="px-10 py-4 bg-neutral-900 text-white font-black rounded-2xl shadow-xl shadow-black/20 hover:bg-black hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                >
                    {isPending ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            Save Evaluation
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
