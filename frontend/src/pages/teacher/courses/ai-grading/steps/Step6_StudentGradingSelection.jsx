export default function Step6_StudentGradingSelection({
    submissions,
    allPairings,
    selectedStudents,
    setSelectedStudents,
    onGradeSelected,
    isGradingBulk,
    onBack,
    onJumpToStep
}) {
    // Robustness: If submissions hasn't loaded yet, but we HAVE pairings
    const hasAnyPaired = Object.keys(allPairings).length > 0;
    const isSyncing = submissions.length === 0 && hasAnyPaired;

    const toggleAll = () => {
        const pairedIds = submissions.filter(s => !!allPairings[s.id]).map(s => s.id);
        if (selectedStudents.length === pairedIds.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(pairedIds);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <div>
                    <h3 className="text-xl font-semibold text-text-primary">Final Student Selection</h3>
                    <p className="text-sm text-text-muted mt-1 uppercase tracking-widest font-semibold">Step 6: Choose who to grade with AI</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={onGradeSelected}
                        disabled={isGradingBulk || selectedStudents.length === 0}
                        className={`min-w-[240px] px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:scale-100 ${isGradingBulk ? 'bg-primary text-white cursor-wait animate-pulse' : 'bg-success text-white hover:bg-success-hover shadow-success/30'}`}
                    >
                        {isGradingBulk ? (
                            <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> AI is Grading...</>
                        ) : (
                            <>Start Grading {selectedStudents.length} Students</>
                        )}
                    </button>
                </div>
            </div>

            {isSyncing ? (
                <div className="text-center py-20 bg-white border border-neutral-200 rounded-3xl shadow-inner group">
                    <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <span className="relative flex h-10 w-10">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>
                          <span className="relative inline-flex rounded-full h-10 w-10 bg-primary/10 items-center justify-center">
                             <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                             </svg>
                          </span>
                        </span>
                    </div>
                    <p className="text-sm text-text-muted font-bold italic mb-2 uppercase tracking-[0.2em]">Syncing student submissions...</p>
                    <p className="text-xs text-text-muted opacity-60">This usually takes just a moment.</p>
                </div>
            ) : submissions.length === 0 ? (
                <div className="text-center py-20 bg-white border border-neutral-200 rounded-3xl shadow-inner group">
                    <div className="w-20 h-20 bg-neutral-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <svg className="w-10 h-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-sm text-text-muted font-bold italic mb-4 uppercase tracking-[0.2em]">No students found for this assessment.</p>
                    <button onClick={onBack} className="text-primary font-black text-xs uppercase tracking-widest hover:underline px-6 py-2 rounded-xl bg-primary/10 transition-all hover:bg-primary/20">
                        Go Back
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Stats & Actions */}
                    <div className="flex justify-between items-center px-4">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={toggleAll}
                                className="text-xs font-black text-primary uppercase tracking-widest hover:underline disabled:opacity-30"
                                disabled={submissions.filter(s => !!allPairings[s.id]).length === 0}
                            >
                                {selectedStudents.length > 0 && selectedStudents.length === submissions.filter(s => !!allPairings[s.id]).length 
                                    ? 'Deselect All' : 'Select All Ready'}
                            </button>
                            <div className="h-4 w-px bg-neutral-200" />
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success"></span>
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">{submissions.filter(s => !!allPairings[s.id]).length} Paired</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">{submissions.filter(s => !allPairings[s.id]).length} Unpaired</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                            {selectedStudents.length} Students Selected for Grading
                        </p>
                    </div>

                    {/* Student Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {submissions.map((sub) => {
                            const isPaired = !!allPairings[sub.id];
                            const isSelected = selectedStudents.includes(sub.id);

                            return (
                                <div
                                    key={sub.id}
                                    onClick={() => {
                                        if (!isPaired) return;
                                        setSelectedStudents(prev => isSelected ? prev.filter(x => x !== sub.id) : [...prev, sub.id]);
                                    }}
                                    className={`bg-white rounded-3xl border transition-all duration-300 p-6 flex flex-col relative group overflow-hidden ${!isPaired ? 'opacity-80 border-dashed border-neutral-300 grayscale hover:grayscale-0' : isSelected ? 'border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.02]' : 'border-neutral-200 hover:border-primary/50 cursor-pointer shadow-sm hover:shadow-xl'}`}
                                >
                                    {/* Selection Overlay for Paired */}
                                    {isPaired && isSelected && (
                                        <div className="absolute top-4 right-4 bg-primary text-white p-1.5 rounded-xl border-2 border-white shadow-lg animate-in zoom-in duration-300">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-5">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner ring-4 ring-white shrink-0 group-hover:rotate-3 transition-transform ${isSelected ? 'bg-primary/10' : 'bg-neutral-100'}`}>
                                            {sub.user?.profile_picture ? (
                                                <img src={sub.user.profile_picture} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className={`text-2xl font-black ${isSelected ? 'text-primary' : 'text-neutral-400'}`}>
                                                    {(sub.user?.name ?? '?')[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-black text-text-primary truncate leading-tight mb-1">{sub.user?.name ?? 'Unknown Student'}</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] text-text-muted font-bold tracking-tight bg-neutral-100 px-2 py-0.5 rounded-lg border border-neutral-200">ID: {sub.id.slice(0, 10)}</span>
                                                {isPaired ? (
                                                    <span className="flex items-center gap-1.5 text-[10px] text-success font-black uppercase tracking-wider">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                                        Ready
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-[10px] text-amber-500 font-black uppercase tracking-wider">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                        Needs Pairing
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {!isPaired && (
                                        <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 flex items-center justify-between">
                                            <p className="text-[10px] text-text-muted font-medium italic">Pairing data missing for this user.</p>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onJumpToStep(3); // Jump directly to Pairing
                                                }}
                                                className="text-[10px] font-black text-primary hover:underline uppercase"
                                            >
                                                Fix Now
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
