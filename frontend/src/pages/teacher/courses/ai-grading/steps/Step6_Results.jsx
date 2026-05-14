import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function Step6_Results({
    gradingResults,
    selectedStudents,
    submissions,
    onBack,
    onReset,
    onSaveToDatabase,
    onUpdateResults
}) {
    const [selectedSubId, setSelectedSubId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editingQIdx, setEditingQIdx] = useState(null);
    const [editData, setEditData] = useState({ score: 0, feedback: '' });

    const handleSave = async () => {
        setIsSaving(true);
        await onSaveToDatabase();
        setIsSaving(false);
    };

    const closeModal = () => {
        setSelectedSubId(null);
        setEditingQIdx(null);
    };

    const handleStartEdit = (idx, qRes) => {
        setEditingQIdx(idx);
        // If feedback is object, take the summary
        const rawFeedback = qRes.feedback;
        const feedbackText = typeof rawFeedback === 'object' ? (rawFeedback.summary || JSON.stringify(rawFeedback)) : rawFeedback;
        setEditData({ score: qRes.score, feedback: feedbackText });
    };

    const handleSaveEdit = (idx) => {
        const result = gradingResults[selectedSubId];
        const updatedResultsList = [...result.results];
        
        // Update the specific question
        const oldQ = updatedResultsList[idx];
        const newScore = parseFloat(editData.score) || 0;

        if (newScore > oldQ.points) {
            toast.error(`Score cannot exceed maximum points (${oldQ.points})`);
            return;
        }

        const newQ = { 
            ...oldQ, 
            score: newScore,
            feedback: editData.feedback,
            is_manually_edited: true
        };
        updatedResultsList[idx] = newQ;

        // Recalculate total score
        const newTotalScore = updatedResultsList.reduce((acc, curr) => acc + (parseFloat(curr.score) || 0), 0);

        const updatedResult = {
            ...result,
            results: updatedResultsList,
            total_score: newTotalScore
        };

        onUpdateResults(selectedSubId, updatedResult);
        setEditingQIdx(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            {/* Header */}
            <div className="flex justify-between items-end bg-white p-10 rounded-[2.5rem] border border-neutral-200 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-20 -translate-y-20 blur-3xl opacity-50" />
                <div className="relative z-10">
                    <h3 className="text-4xl font-black text-text-primary tracking-tighter">Grading <span className="text-primary">Complete</span></h3>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="flex h-2 w-2 rounded-full bg-success"></span>
                        <p className="text-xs text-text-muted font-bold uppercase tracking-widest bg-success/5 text-success-600 px-3 py-1 rounded-full border border-success/10">
                            Evaluated {selectedStudents.length} Students
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 relative z-10">
                    <button
                        onClick={onBack}
                        className="px-6 py-3.5 rounded-2xl border-2 border-neutral-200 text-text-secondary font-black hover:bg-neutral-50 transition-all active:scale-95 text-sm"
                    >
                        Adjust Configuration
                    </button>
                    <button
                        onClick={onReset}
                        className="px-6 py-3.5 rounded-2xl border-2 border-neutral-200 text-text-secondary font-black hover:bg-neutral-50 transition-all active:scale-95 text-sm"
                    >
                        Reset All
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3.5 rounded-2xl bg-neutral-900 text-white font-black hover:bg-black transition-all active:scale-95 shadow-xl shadow-black/20 text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? 'Saving...' : 'Save to Database'}
                    </button>
                </div>
            </div>

            {/* Scoreboard Cards */}
            <div className="grid grid-cols-1 gap-5">
                {selectedStudents.map(subId => {
                    const result = gradingResults[subId];
                    const student = submissions.find(s => s.id === subId);
                    if (!result) return null;

                    return (
                        <div
                            key={subId}
                            onClick={() => setSelectedSubId(subId)}
                            className="bg-white border border-neutral-200 rounded-[2rem] p-6 shadow-sm flex items-center justify-between group hover:border-primary/30 hover:shadow-2xl transition-all duration-500 cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/[0.02] translate-x-full group-hover:translate-x-0 transition-transform duration-700" />

                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-accent-100 flex items-center justify-center overflow-hidden shadow-inner ring-4 ring-white group-hover:ring-primary/10 transition-all duration-500">
                                    {student?.user?.profile_picture ? (
                                        <img src={student.user.profile_picture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-black text-accent-500">{student?.user?.name?.[0].toUpperCase()}</span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-text-primary tracking-tight group-hover:text-primary transition-colors">{student?.user?.name}</h4>
                                    <p className="text-[11px] text-text-muted font-bold tracking-widest uppercase mt-0.5 opacity-60">ID: {subId.slice(0, 12)}</p>
                                </div>
                            </div>

                            <div className="text-right relative z-10">
                                <div className="flex items-baseline justify-end gap-2">
                                    <span className="text-4xl font-black text-neutral-900 tracking-tighter tabular-nums">
                                        {result.total_score}
                                    </span>
                                    <span className="text-lg text-text-muted font-bold tracking-tight opacity-40">
                                        / {result.max_total_score}
                                    </span>
                                </div>
                                <div className="text-[9px] font-black text-success uppercase tracking-[0.2em] mt-1 bg-success/10 px-3 py-1 rounded-full border border-success/20 inline-block shadow-sm">
                                    Graded by Checkmate AI
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detailed Evaluation Modal */}
            {selectedSubId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xl" onClick={closeModal} />

                    <div className="bg-neutral-50 w-full max-w-6xl h-[85vh] rounded-[3rem] shadow-2xl relative z-10 flex flex-col overflow-hidden border border-white/20">
                        {/* Modal Header */}
                        <div className="bg-white px-10 py-8 border-b border-neutral-200 flex justify-between items-center bg-gradient-to-r from-white to-neutral-50/50">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/20">
                                    {submissions.find(s => s.id === selectedSubId)?.user?.name?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-text-primary tracking-tight">
                                        Evaluation Report: <span className="text-primary">{submissions.find(s => s.id === selectedSubId)?.user?.name}</span>
                                    </h4>
                                    <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em]">Comprehensive AI Analysis</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right border-r border-neutral-200 pr-6">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Score</p>
                                    <p className="text-3xl font-black text-primary tracking-tighter">
                                        {gradingResults[selectedSubId].total_score} <span className="text-sm text-text-muted/40 font-bold">/ {gradingResults[selectedSubId].max_total_score}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-3 rounded-2xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition-all font-black text-xl"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <div className="space-y-10">
                                {gradingResults[selectedSubId].results.map((qRes, idx) => {
                                    // Intelligent feedback parser to handle AI inconsistencies
                                    const parseFeedback = (raw) => {
                                        if (typeof raw === 'object' && raw !== null) return raw;

                                        const result = {
                                            positive_points: [],
                                            negative_points: [],
                                            improvement_points: [],
                                            summary: raw
                                        };

                                        if (typeof raw !== 'string') return result;

                                        // Simple regex-based fallback parser for semi-structured text
                                        const sections = {
                                            positive: /Positive Points:?\s*([\s\S]*?)(?=Negative Points:|Critical Gaps:|Areas for Improvement:|Summary:|$)/i,
                                            negative: /Negative Points:|Critical Gaps:?\s*([\s\S]*?)(?=Positive Points:|Areas for Improvement:|Summary:|$)/i,
                                            improvement: /Areas for Improvement:?\s*([\s\S]*?)(?=Positive Points:|Negative Points:|Critical Gaps:|Summary:|$)/i,
                                            summary: /Summary:?\s*([\s\S]*)/i
                                        };

                                        Object.entries(sections).forEach(([key, regex]) => {
                                            const match = raw.match(regex);
                                            if (match && match[1]) {
                                                const content = match[1].trim();
                                                if (key === 'summary') {
                                                    result.summary = content;
                                                } else {
                                                    // Convert bulleted list to array
                                                    result[`${key}_points`] = content.split('\n').map(l => l.replace(/^[*-]\s*/, '').trim()).filter(Boolean);
                                                }
                                            }
                                        });

                                        return result;
                                    };

                                    const feedback = parseFeedback(qRes.feedback);
                                    const isStructured = feedback.positive_points?.length > 0 || feedback.negative_points?.length > 0 || feedback.improvement_points?.length > 0;

                                    return (
                                        <div key={idx} className="bg-white rounded-[2rem] border border-neutral-200 overflow-hidden shadow-sm group/q hover:shadow-xl transition-all duration-500">
                                            {/* Q Header */}
                                            <div className="px-8 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 group-hover/q:bg-white transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-black bg-neutral-900 text-white px-4 py-1.5 rounded-full tracking-widest uppercase">
                                                        Question {qRes.label}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                                                        {qRes.type === 'McqQuestion' ? 'Multiple Choice' : 'Text Based'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm font-black text-primary bg-white px-5 py-2 rounded-full shadow-sm ring-1 ring-neutral-100">
                                                        {qRes.score} <span className="opacity-30 mx-1">/</span> {qRes.points} <span className="ml-1 text-[10px] text-neutral-300 font-bold">Marks</span>
                                                    </div>
                                                    {editingQIdx !== idx && (
                                                        <button
                                                            onClick={() => handleStartEdit(idx, qRes)}
                                                            className="p-2 bg-white border border-neutral-200 rounded-xl text-neutral-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                                                            title="Edit Score & Feedback"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="px-10 py-4 space-y-8">
                                                {/* Question & Options */}
                                                <div>

                                                    <p className="text-lg font-bold text-text-primary leading-snug">
                                                        {qRes.question_text || "The question text was not available for this session."}
                                                    </p>

                                                    {qRes.type === 'McqQuestion' && qRes.options?.length > 0 && (
                                                        <div className="grid grid-cols-2 gap-3 mt-6">
                                                            {qRes.options.map((opt, i) => {
                                                                const isStudentChoice = qRes.answer === opt;
                                                                return (
                                                                    <div key={i} className={`p-4 rounded-2xl border text-sm font-bold transition-all ${isStudentChoice ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-neutral-50 border-neutral-100 text-neutral-400 opacity-60'}`}>
                                                                        <span className={`w-6 h-6 inline-flex items-center justify-center rounded-lg mr-3 text-[10px] ${isStudentChoice ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                                                                            {String.fromCharCode(65 + i)}
                                                                        </span>
                                                                        {opt}
                                                                        {isStudentChoice && <span className="ml-2 text-[10px] font-black uppercase tracking-widest">(Selected)</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Student Answer */}
                                                {qRes.type !== 'McqQuestion' && (
                                                    <div className="p-6 bg-accent-50/30 rounded-3xl border border-accent-100 relative">
                                                        <div className="absolute -top-3 left-6 px-3 bg-white border border-accent-100 rounded-full">
                                                            <span className="text-[10px] font-black text-accent-600 uppercase tracking-widest">Student Submission</span>
                                                        </div>
                                                        <p className="text-sm text-text-secondary font-medium leading-relaxed italic">
                                                            "{qRes.answer || '(Blank)'}"
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="h-px bg-neutral-100" />

                                                {/* AI Feedback Grid / Editor */}
                                                <div>
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h5 className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                                                            {editingQIdx === idx ? 'Edit Evaluation' : 'AI Feedback & Analysis'}
                                                        </h5>
                                                        {qRes.is_manually_edited && (
                                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Manually Adjusted</span>
                                                        )}
                                                    </div>

                                                    {editingQIdx === idx ? (
                                                        <div className="space-y-6 bg-neutral-50 p-6 rounded-[2rem] border border-primary/20 shadow-inner">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Adjust Score</label>
                                                                    <div className="flex items-center gap-3">
                                                                        <input
                                                                            type="number"
                                                                            value={editData.score}
                                                                            max={qRes.points}
                                                                            min={0}
                                                                            onChange={(e) => setEditData({ ...editData, score: e.target.value })}
                                                                            className="w-24 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl font-black text-primary outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                                                        />
                                                                        <span className="text-lg font-black text-neutral-300">/ {qRes.points}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Edit Feedback Summary</label>
                                                                <textarea
                                                                    value={editData.feedback}
                                                                    onChange={(e) => setEditData({ ...editData, feedback: e.target.value })}
                                                                    rows={4}
                                                                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                                                    placeholder="Enter your manual feedback here..."
                                                                />
                                                            </div>
                                                            <div className="flex gap-3 pt-2">
                                                                <button
                                                                    onClick={() => handleSaveEdit(idx)}
                                                                    className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-black transition-all active:scale-95"
                                                                >
                                                                    Save Changes
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingQIdx(null)}
                                                                    className="px-6 py-2.5 bg-white border border-neutral-200 text-text-secondary rounded-xl text-xs font-black hover:bg-neutral-50 transition-all"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {isStructured ? (
                                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                                    {/* Positive */}
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-2 text-success uppercase text-[10px] font-black tracking-widest">
                                                                            <div className="w-5 h-5 rounded-lg bg-success/20 flex items-center justify-center">
                                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                                                            </div>
                                                                            Positive Points
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {feedback.positive_points?.map((p, i) => (
                                                                                <div key={i} className="p-3 bg-success/5 border border-success/10 rounded-xl text-xs font-bold text-success-800 leading-tight">
                                                                                    {p}
                                                                                </div>
                                                                            )) || <p className="text-[10px] text-neutral-400 italic">None noted.</p>}
                                                                        </div>
                                                                    </div>

                                                                    {/* Negative */}
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-2 text-danger-500 uppercase text-[10px] font-black tracking-widest">
                                                                            <div className="w-5 h-5 rounded-lg bg-danger-50 flex items-center justify-center">
                                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                            </div>
                                                                            Critical Gaps
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {feedback.negative_points?.map((p, i) => (
                                                                                <div key={i} className="p-3 bg-danger-50 border border-danger-100 rounded-xl text-xs font-bold text-danger-700 leading-tight">
                                                                                    {p}
                                                                                </div>
                                                                            )) || <p className="text-[10px] text-neutral-400 italic">None noted.</p>}
                                                                        </div>
                                                                    </div>

                                                                    {/* Improvements */}
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-2 text-accent-600 uppercase text-[10px] font-black tracking-widest">
                                                                            <div className="w-5 h-5 rounded-lg bg-accent-100 flex items-center justify-center">
                                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                            </div>
                                                                            To Improve
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {feedback.improvement_points?.map((p, i) => (
                                                                                <div key={i} className="p-3 bg-accent-50 border border-accent-100 rounded-xl text-xs font-bold text-accent-700 leading-tight">
                                                                                    {p}
                                                                                </div>
                                                                            )) || <p className="text-[10px] text-neutral-400 italic">None noted.</p>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : null}

                                                            <div className={`mt-6 p-6 rounded-3xl bg-neutral-900 text-white shadow-xl shadow-neutral-900/10 relative overflow-hidden ${!isStructured ? 'mt-0' : ''}`}>
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 -translate-y-12 blur-2xl" />
                                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 relative z-10">Executive Summary</p>
                                                                <p className="text-[13px] font-bold leading-relaxed relative z-10 text-white/90">
                                                                    {feedback.summary || feedback}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
