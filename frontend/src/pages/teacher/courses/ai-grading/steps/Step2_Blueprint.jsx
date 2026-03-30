import React from 'react';
import QuestionItem from '../QuestionItem';

export default function Step2_Blueprint({
    questions,
    onUpdateQuestion,
    onDeleteQuestion,
    onAddQuestion,
    onConfirm,
    onBack,
    pdfUrl,
    showPdf,
    setShowPdf
}) {
    return (
        <div className={`grid gap-6 ${showPdf && pdfUrl ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Left Column: Questions List */}
            <div className="space-y-4">
                <div className="flex-col gap-3 fy-between items-center mb-6 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm sticky top-0 z-10">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-text-primary">Review Blueprint</h3>
                        <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">Verify {questions.length} Extracted Questions</p>
                    </div>
                    <div className="flex gap-9 mt-3 shrink-0">
                        {pdfUrl && (
                            <button
                                onClick={() => setShowPdf(!showPdf)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${showPdf ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-text-secondary border-neutral-200 hover:bg-neutral-50 shadow-sm'}`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPdf ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.018 10.018 0 014.288-5.76M11.214 7.214a3 3 0 013.572 3.572M15 12a3 3 0 01-3 3M17.657 16.657L13.414 12.414m-1.414-1.414l-4.243-4.243m-2.828-2.828l16.97 16.97"} />
                                </svg>
                                {showPdf ? 'Hide Source' : 'View Source'}
                            </button>
                        )}
                        <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm font-bold text-text-secondary bg-white text-text-secondary border border-neutral-200 hover:bg-neutral-50 shadow-sm transition-all">
                            Re-extract
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={questions.length === 0}
                            className="px-6 py-2 rounded-xl bg-success text-text-inverse text-sm font-bold hover:bg-success-hover transition-all shadow-lg shadow-success/20 disabled:opacity-50 active:scale-95"
                        >
                            Confirm Blueprint
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {questions.map((q, idx) => (
                        <QuestionItem
                            key={idx}
                            question={q}
                            onChange={(updated) => onUpdateQuestion(idx, updated)}
                            onDelete={() => onDeleteQuestion(idx)}
                            isReadOnly={false}
                            hideRubric={true}
                        />
                    ))}
                </div>

                <button
                    onClick={onAddQuestion}
                    className="w-full py-5 mt-8 border-2 border-dashed border-neutral-300 rounded-3xl text-sm font-bold text-text-muted hover:text-primary hover:border-primary hover:bg-primary-50 transition-all flex items-center justify-center gap-2 group"
                >
                    <span className="text-xl group-hover:scale-125 transition-transform">+</span>
                    Add Question Manually
                </button>
            </div>

            {/* Right Column: PDF Preview */}
            {showPdf && pdfUrl && (
                <div className="hidden lg:block relative">
                    <div className="sticky top-6 h-[calc(100vh-180px)] bg-neutral-900/5 rounded-3xl border border-neutral-200 overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 right-0 bg-neutral-800 text-white px-5 py-3 text-[10px] font-bold uppercase tracking-widest flex justify-between items-center z-10 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
                                Live Source Material
                            </div>
                            <button onClick={() => setShowPdf(false)} className="hover:text-red-400 transition-colors">
                                CLOSE PREVIEW
                            </button>
                        </div>
                        <iframe
                            src={`${pdfUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-full pt-10"
                            title="Question Source"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
