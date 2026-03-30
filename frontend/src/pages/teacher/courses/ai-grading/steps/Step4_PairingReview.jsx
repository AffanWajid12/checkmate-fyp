import React, { useState } from 'react';
import QuestionItem from '../QuestionItem';

export default function Step4_PairingReview({
    student,
    pairedResults,
    onUpdatePairedQuestion,
    onBack,
    onContinue,
    combinedPdfUrl,
    selectedSubmissionId,
    selectedStudents,
    setSelectedStudents
}) {
    const [showPdf, setShowPdf] = useState(true);

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-240px)] animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-neutral-200 shadow-xl shrink-0 group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-accent-100 flex items-center justify-center overflow-hidden shadow-inner ring-4 ring-white shrink-0 group-hover:scale-105 transition-transform">
                        {student?.user?.profile_picture ? (
                            <img src={student.user.profile_picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-accent-500">{student?.user?.name?.[0].toUpperCase()}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            {/* Changed font-black to font-bold */}
                            <h3 className="text-base font-bold text-text-primary truncate">{student?.user?.name || 'Reviewing Answer'}</h3>
                            <span className="text-[10px] font-bold bg-success-100 text-success px-2 py-0.5 rounded-md uppercase tracking-wider border border-success-200">AI Paired</span>
                        </div>
                        {/* Reduced tracking and weight here */}
                        <p className="text-xs text-text-muted mt-0.5 font-medium flex items-center gap-2">
                            ID: <span className="font-mono select-all">{selectedSubmissionId?.slice(0, 12)}</span>
                            <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                            Review meticulously before grading
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 items-center shrink-0">
                    <button
                        onClick={() => setShowPdf(!showPdf)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all active:scale-95 border-2 ${showPdf ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-white border-neutral-200 text-text-secondary'}`}
                    >
                        <svg className={`w-4 h-4 transition-transform duration-500 `} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {showPdf ? 'Hide PDF' : 'Show PDF'}
                    </button>

                    <div className="w-[1px] h-8 bg-neutral-100 mx-1" />

                    <button
                        onClick={() => {
                            if (!selectedStudents.includes(selectedSubmissionId)) {
                                setSelectedStudents([...selectedStudents, selectedSubmissionId]);
                            }
                            onContinue();
                        }}
                        className="px-4 py-2 rounded-xl bg-success text-white text-sm font-semibold hover:bg-success-hover transition-all shadow-lg shadow-success/10 active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Finish Review
                    </button>

                </div>
            </div>

            {/* Split Content */}
            <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {pairedResults.map((resData, fileIdx) => (
                        <div key={fileIdx} className="space-y-6">
                            {resData.error ? (
                                <div className="p-6 bg-white rounded-2xl border border-red-100 flex items-center gap-4 text-red-600 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm uppercase">AI Pairing Failed</p>
                                        <p className="text-xs mt-1 opacity-90 font-mono bg-red-50 p-2 rounded-lg">{resData.error}</p>
                                    </div>
                                </div>
                            ) : Array.isArray(resData.result) ? (
                                <div className="space-y-6">
                                    {resData.result.map((q, qIdx) => (
                                        <div key={qIdx} className="transition-transform duration-300">
                                            <QuestionItem
                                                question={q}
                                                onChange={(updated) => onUpdatePairedQuestion(fileIdx, qIdx, updated)}
                                                isReadOnly={false}
                                                hideRubric={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-red-100">
                                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Invalid Result Format</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Right Pane: PDF Viewer (Matching Step 2 Design) */}
                {showPdf && combinedPdfUrl && (
                    <div className="flex-1 bg-neutral-900/5 rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden animate-in slide-in-from-right-8 fade-in duration-700 relative">
                        <div className="absolute top-0 left-0 right-0 bg-neutral-800 text-white px-5 py-3 text-[10px] font-bold uppercase tracking-widest flex justify-between items-center z-10 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                Live Student Submission
                            </div>
                            <button onClick={() => setShowPdf(false)} className="hover:text-red-400 transition-colors uppercase">
                                Close Preview
                            </button>
                        </div>
                        <iframe
                            src={`${combinedPdfUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-full pt-10 border-none"
                            title="Student Submission Review"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}