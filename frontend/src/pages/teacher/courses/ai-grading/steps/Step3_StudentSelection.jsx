import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function Step3_StudentSelection({
    submissions,
    allPairings,
    onPairStudent,
    onContinue,
    onBack,
    isScanned,
    setIsScanned,
    pairAnswersAsync,
    questions,
    assessmentId,
    setAllPairings,
    selectedStudents,
    setSelectedStudents,
    toggleStudentSelection,
    isPairing,
    pairingStudentId
}) {
    const [bulkPairingStatus, setBulkPairingStatus] = useState({ isRunning: false, current: 0, total: 0 });

    const handlePairAll = async () => {
        const unpaired = submissions.filter(s => !allPairings[s.id]);
        if (unpaired.length === 0) {
            toast.success("All students are already paired!");
            return;
        }

        setBulkPairingStatus({ isRunning: true, current: 1, total: unpaired.length });
        let updatedPairings = { ...allPairings };
        let newSelected = [...selectedStudents];

        for (let i = 0; i < unpaired.length; i++) {
            const sub = unpaired[i];
            setBulkPairingStatus(prev => ({ ...prev, current: i + 1 }));

            try {
                const data = await pairAnswersAsync({
                    submissionId: sub.id,
                    questions,
                    isScanned
                });

                updatedPairings[sub.id] = {
                    results: data.results,
                    combinedPdfUrl: data.combined_pdf_url
                };

                if (!newSelected.includes(sub.id)) {
                    newSelected.push(sub.id);
                }

                // Update state and localStorage incrementally
                setAllPairings({ ...updatedPairings });
                setSelectedStudents([...newSelected]);
                localStorage.setItem(`assessment_${assessmentId}_pairings`, JSON.stringify(updatedPairings));
            } catch (err) {
                console.error(`Failed to pair student ${sub.id}:`, err);
                toast.error(`Error pairing ${sub.user?.name || sub.id}`);
            }
        }

        setBulkPairingStatus({ isRunning: false, current: 0, total: 0 });
        toast.success("Bulk pairing complete!");
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <div>
                    <h3 className="text-xl  text-text-primary font-semibold">Identify Student Answers</h3>
                    <p className="text-sm text-text-muted mt-1 uppercase tracking-wides font-semibold">Step 3: Pair the Questions and Answers for grading</p>
                </div>
            </div>

            {submissions.length === 0 ? (
                <div className="text-center py-20 bg-white border border-neutral-200 rounded-3xl shadow-inner">
                    <p className="text-sm text-text-muted font-bold italic">No submissions found for this assessment.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center gap-6 mb-8 bg-neutral-50 p-8 rounded-3xl border border-neutral-200 shadow-sm">
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Source Content Type</p>
                            <div className="flex items-center gap-1 bg-neutral-200/50 p-1.5 rounded-2xl border border-neutral-200 shadow-inner">
                                <button
                                    onClick={() => setIsScanned(true)}
                                    disabled={bulkPairingStatus.isRunning}
                                    className={`px-8 py-3 rounded-xl justify-center text-xs font-bold transition-all flex items-center gap-2 ${isScanned ? 'bg-white shadow-md text-primary border border-neutral-100' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/20'}`}
                                >
                                    Handwritten/Scanned
                                </button>
                                <button
                                    onClick={() => setIsScanned(false)}
                                    disabled={bulkPairingStatus.isRunning}
                                    className={`px-8 py-3 rounded-xl justify-center text-xs font-bold transition-all flex items-center gap-2 ${!isScanned ? 'bg-white shadow-md text-primary border border-neutral-100' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/20'}`}
                                >
                                    Digital PDF/Code
                                </button>
                            </div>
                        </div>

                        <div className="h-px w-full max-w-sm bg-neutral-200" />

                        <div className="flex flex-col items-center gap-4 w-full max-w-lg">
                            <div className="flex gap-4">
                                <button
                                    onClick={handlePairAll}
                                    disabled={bulkPairingStatus.isRunning}
                                    className={`group relative px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 disabled:scale-100 flex items-center gap-3 w-fit ${bulkPairingStatus.isRunning ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-white text-accent-600 hover:bg-accent-600 hover:text-white border border-accent-100 shadow-accent-600/20'}`}
                                >
                                    {bulkPairingStatus.isRunning ? (
                                        <div className="flex items-center justify-center gap-4">
                                            <div className="flex gap-1.5">
                                                <span className="w-2 h-2 bg-accent-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-accent-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                                                <span className="w-2 h-2 bg-accent-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
                                            </div>
                                            <span className="text-accent-700">AI Processing...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-sm font-bold">
                                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Pair All Students
                                        </div>
                                    )}

                                    {!bulkPairingStatus.isRunning && (
                                        <div className="absolute -top-3 -right-3 bg-accent-600 text-white text-[10px] px-3 py-1 rounded-full border-2 border-white shadow-xl font-black">
                                            {submissions.filter(s => !allPairings[s.id]).length}
                                        </div>
                                    )}
                                </button>

                                {Object.keys(allPairings).length > 0 && (
                                    <button
                                        onClick={onContinue}
                                        className="text-sm font-bold px-8 py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        Setup Grading Parameters
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {bulkPairingStatus.isRunning && (
                                <div className="w-full space-y-4 p-6 bg-white rounded-3xl border border-accent-100 shadow-2xl shadow-accent-600/10">
                                    <div className="flex justify-between items-center text-[10px] font-black text-accent-600 uppercase tracking-[0.2em]">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-accent-600 rounded-full animate-pulse"></span>
                                            <span>Student {bulkPairingStatus.current} of {bulkPairingStatus.total}</span>
                                        </div>
                                        <div className="bg-accent-50 px-3 py-1 rounded-full border border-accent-100 ring-4 ring-accent-50/50">
                                            {Math.round(((bulkPairingStatus.current - 1) / bulkPairingStatus.total) * 100)}% Complete
                                        </div>
                                    </div>
                                    <div className="w-full h-4 bg-accent-50 rounded-full overflow-hidden border border-accent-100 p-1 shadow-inner">
                                        <div
                                            className="h-full bg-accent-600 rounded-full transition-all duration-1000 ease-in-out relative overflow-hidden"
                                            style={{ width: `${Math.max(5, ((bulkPairingStatus.current - 1) / bulkPairingStatus.total) * 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-center text-text-muted font-bold italic">Extracting student handwriting... Please stay on this screen.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {submissions.map((sub) => {
                            const isAlreadyPaired = !!allPairings[sub.id];

                            return (
                                <div
                                    key={sub.id}
                                    className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative group ${isAlreadyPaired ? 'border-success/30 ring-1 ring-success/10 bg-success-50/5 shadow-sm' : 'border-neutral-200 hover:border-accent-300 hover:shadow-xl shadow-sm'}`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-accent-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner ring-1 ring-white">
                                                    {sub.user?.profile_picture ? (
                                                        <img src={sub.user.profile_picture} alt="Student" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xl font-black text-accent-500">{(sub.user?.name ?? '?')[0].toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-text-primary truncate leading-tight">{sub.user?.name ?? 'Unknown Student'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${sub.status === 'LATE' ? 'bg-amber-100 text-amber-600' : 'bg-neutral-100 text-neutral-500'}`}>
                                                            {sub.status}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted font-bold">ID: {sub.id.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isAlreadyPaired && (
                                                <div className="bg-success-100 text-success text-[10px] font-black p-1.5 rounded-xl shadow-sm">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="px-5 pb-5 pt-0 flex gap-2">
                                        <button
                                            onClick={() => onPairStudent(sub.id)}
                                            disabled={isPairing || bulkPairingStatus.isRunning}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isAlreadyPaired ? 'bg-success text-white hover:bg-success-hover shadow-lg shadow-success/20' : 'bg-accent-50 text-accent-600 hover:bg-accent-600 hover:text-white border border-accent-100 shadow-sm'} ${isPairing && pairingStudentId === sub.id ? 'bg-accent-600 text-white' : ''}`}
                                        >
                                            {isPairing && pairingStudentId === sub.id ? (
                                                <>
                                                    <span className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                                                    Pairing...
                                                </>
                                            ) : isAlreadyPaired ? (
                                                'Review Pairing'
                                            ) : (
                                                'Pair Now'
                                            )}
                                        </button>
                                        {isAlreadyPaired && (
                                            <button
                                                onClick={() => onPairStudent(sub.id, true)}
                                                className="px-3 py-3 rounded-xl border border-neutral-200 text-neutral-400 hover:text-accent-600 hover:border-accent-200 transition-all shadow-sm active:scale-95"
                                                title="Re-run AI Extraction"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
