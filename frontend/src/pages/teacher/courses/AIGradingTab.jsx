import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useExtractQuestions, usePairStudentAnswers } from '../../../hooks/useCourses';
import QuestionItem from './QuestionItem';

export default function AIGradingTab({ courseId, assessmentId, submitted, late, sourceMaterials }) {
    // 1: Extract, 2: Review Questions, 3: Select Student, 4: Review Pairings
    const [step, setStep] = useState(1);

    // PDF Viewer state
    const [showPdf, setShowPdf] = useState(true);
    const pdfUrl = sourceMaterials?.find(m => m.mime_type === 'application/pdf')?.signed_url;

    // Questions blueprint state
    const [questions, setQuestions] = useState([]);

    // Document Type state
    const [isScanned, setIsScanned] = useState(true);

    // Paring Results state
    const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
    const [pairedResults, setPairedResults] = useState([]);
    const [combinedPdfUrl, setCombinedPdfUrl] = useState(null);
    const [allPairings, setAllPairings] = useState({}); // { [submissionId]: { results, combinedPdfUrl } }
    const [bulkPairingStatus, setBulkPairingStatus] = useState({ isRunning: false, current: 0, total: 0 });

    const { mutate: extractQuestions, isPending: isExtracting } = useExtractQuestions(courseId, assessmentId);
    const { mutate: pairAnswers, mutateAsync: pairAnswersAsync, isPending: isPairing } = usePairStudentAnswers(courseId, assessmentId);

    // Load saved blueprint and pairings from localStorage on mount
    useEffect(() => {
        const savedQuestions = localStorage.getItem(`assessment_${assessmentId}_questions`);
        if (savedQuestions) {
            try {
                const parsed = JSON.parse(savedQuestions);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setQuestions(parsed);
                    setStep(2);
                }
            } catch (e) {
                console.error("Failed to parse saved questions", e);
            }
        }

        const savedPairings = localStorage.getItem(`assessment_${assessmentId}_pairings`);
        if (savedPairings) {
            try {
                setAllPairings(JSON.parse(savedPairings));
            } catch (e) {
                console.error("Failed to parse saved pairings", e);
            }
        }
    }, [assessmentId]);

    const clearAllPairings = () => {
        setAllPairings({});
        localStorage.removeItem(`assessment_${assessmentId}_pairings`);
    };

    const handleExtract = () => {
        extractQuestions(
            { isScanned },
            {
                onSuccess: (data) => {
                    const extracted = data.questions || [];
                    setQuestions(extracted);
                    localStorage.setItem(`assessment_${assessmentId}_questions`, JSON.stringify(extracted));
                    clearAllPairings(); // Blueprint reset
                    toast.success("Questions extracted successfully!");
                    setStep(2);
                },
                onError: (err) => {
                    toast.error(err?.response?.data?.message || "Extraction failed. Is QA-Pairing service running?");
                }
            }
        );
    };

    const handleSaveBlueprint = () => {
        localStorage.setItem(`assessment_${assessmentId}_questions`, JSON.stringify(questions));
        toast.success("Question blueprint saved!");
        setStep(3);
    };

    const handlePairStudent = (submissionId, forceRePair = false) => {
        setSelectedSubmissionId(submissionId);

        // Check if already paired
        if (!forceRePair && allPairings[submissionId]) {
            const saved = allPairings[submissionId];
            setPairedResults(saved.results);
            setCombinedPdfUrl(saved.combinedPdfUrl);
            setStep(4);
            toast.success("Viewing existing pairing results.");
            return;
        }

        pairAnswers(
            {
                submissionId,
                questions,
                isScanned
            },
            {
                onSuccess: (data) => {
                    const results = data.results;
                    const combinedUrl = data.combined_pdf_url;

                    setPairedResults(results);
                    if (combinedUrl) {
                        setCombinedPdfUrl(combinedUrl);
                    }

                    // Save to allPairings
                    const newPairings = {
                        ...allPairings,
                        [submissionId]: {
                            results,
                            combinedPdfUrl: combinedUrl
                        }
                    };
                    setAllPairings(newPairings);
                    localStorage.setItem(`assessment_${assessmentId}_pairings`, JSON.stringify(newPairings));

                    setStep(4);
                    toast.success("Answers paired successfully!");
                },
                onError: (err) => {
                    toast.error(err?.response?.data?.message || "Pairing failed. Is QA-Pairing service running?");
                }
            }
        );
    };

    const handlePairAll = async () => {
        const unpaired = combinedSubmissions.filter(s => !allPairings[s.id]);
        if (unpaired.length === 0) {
            toast.success("All students are already paired!");
            return;
        }

        setBulkPairingStatus({ isRunning: true, current: 0, total: unpaired.length });

        let successCount = 0;
        let localPairings = { ...allPairings };

        for (let i = 0; i < unpaired.length; i++) {
            const sub = unpaired[i];
            setSelectedSubmissionId(sub.id);
            setBulkPairingStatus(prev => ({ ...prev, current: i + 1 }));

            try {
                const data = await pairAnswersAsync({
                    submissionId: sub.id,
                    questions,
                    isScanned
                });

                const resultObj = {
                    results: data.results,
                    combinedPdfUrl: data.combined_pdf_url
                };

                setAllPairings(prev => {
                    const updated = {
                        ...prev,
                        [sub.id]: resultObj
                    };
                    localStorage.setItem(`assessment_${assessmentId}_pairings`, JSON.stringify(updated));
                    return updated;
                });

                successCount++;
            } catch (err) {
                console.error(`Failed to pair student ${sub.id}`, err);
                toast.error(`Failed to pair student ${sub.user?.name || sub.id}`);
            }
        }

        setBulkPairingStatus({ isRunning: false, current: 0, total: 0 });
        setSelectedSubmissionId(null);

        if (successCount > 0) {
            toast.success(`Successfully paired ${successCount} students!`);
        }
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                label: (questions.length + 1).toString(),
                type: "TextQuestion",
                answer_mode: "text",
                total_marks: 1,
                text: "",
                options: [],
                subparts: [],
            },
        ]);
        clearAllPairings();
    };

    const updateQuestion = (index, updatedQuestion) => {
        const newQuestions = [...questions];
        newQuestions[index] = updatedQuestion;
        setQuestions(newQuestions);
        clearAllPairings();
    };

    const deleteQuestion = (index) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
        clearAllPairings();
    };

    // Paired specific updates
    const updatePairedQuestion = (fileIndex, qIndex, updatedQuestion) => {
        const newResults = [...pairedResults];
        newResults[fileIndex].result[qIndex] = updatedQuestion;
        setPairedResults(newResults);
    };

    const combinedSubmissions = [...(submitted || []), ...(late || [])];

    return (
        <div className="space-y-6">
            {/* Step Header */}
            <div className="flex items-center gap-2 mb-8 bg-neutral-50 p-4 rounded-xl border border-neutral-200 overflow-x-auto">
                {['Extract', 'Review Blueprint', 'Select Student', 'Review Pairings'].map((label, idx) => {
                    const stepNum = idx + 1;
                    const isActive = step === stepNum;
                    const isCompleted = step > stepNum;

                    return (
                        <div key={label} className="flex items-center gap-2 whitespace-nowrap">
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isActive ? 'bg-primary text-white' : isCompleted ? 'bg-success text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                                {isCompleted ? '✓' : stepNum}
                            </div>
                            <span className={`text-sm font-semibold ${isActive ? 'text-primary' : isCompleted ? 'text-text-primary' : 'text-neutral-400'}`}>
                                {label}
                            </span>
                            {stepNum < 4 && <div className="w-8 h-[1px] bg-neutral-300 mx-2" />}
                        </div>
                    );
                })}
            </div>

            {/* STEP 1: Extract Questions */}
            {step === 1 && (
                <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-accent-50 flex items-center justify-center mx-auto text-accent-500">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <circle cx="10" cy="13" r="2" />
                            <path d="M11.5 14.5L14 17" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Extract Assessment Blueprint</h3>
                    <p className="text-sm text-text-secondary max-w-lg mx-auto">
                        We'll use DeepSeek OCR and AI to automatically extract, classify, and structure the questions from the source materials attached to this assessment.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-2 mt-6 mb-2">
                        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                            <button
                                onClick={() => setIsScanned(true)}
                                className={`px-4 py-2.5 rounded-lg justify-center text-sm font-semibold transition-all flex items-center gap-2 ${isScanned ? 'bg-white shadow-sm text-primary border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'}`}
                            >
                                Scanned Document
                                <div className="group relative flex items-center">
                                    <svg className="w-4 h-4 text-neutral-400 cursor-help hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-neutral-800 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center pointer-events-none">
                                        The document is a PDF that was scanned by an app like CamScanner, and the OCR needs to parse it.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800"></div>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setIsScanned(false)}
                                className={`px-4 py-2.5 rounded-lg justify-center text-sm font-semibold transition-all flex items-center gap-2 ${!isScanned ? 'bg-white shadow-sm text-primary border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'}`}
                            >
                                Non-Scanned Document
                                <div className="group relative flex items-center">
                                    <svg className="w-4 h-4 text-neutral-400 cursor-help hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-neutral-800 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center pointer-events-none">
                                        The document contains digital text which can be directly extracted without AI OCR.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800"></div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleExtract}
                        disabled={isExtracting}
                        className="mt-6 px-6 py-3 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                    >
                        {isExtracting ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Extracting Questions...
                            </>
                        ) : 'Extract Questions from PDF'}
                    </button>
                    {isExtracting && <p className="text-xs text-text-muted mt-2">This may take a few minutes depending on the PDF size.</p>}
                </div>
            )}

            {/* STEP 2: Review Blueprint */}
            {step === 2 && (
                <div className={`grid gap-6 ${showPdf && pdfUrl ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Left Column: Questions List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">Review Question Blueprint</h3>
                                <p className="text-xs text-text-muted">Verify extracted questions before pairing with students.</p>
                            </div>
                            <div className="flex gap-2">
                                {pdfUrl && (
                                    <button
                                        onClick={() => setShowPdf(!showPdf)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all flex items-center gap-2 ${showPdf ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-text-secondary border-neutral-200 hover:bg-neutral-50'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPdf ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.018 10.018 0 014.288-5.76M11.214 7.214a3 3 0 013.572 3.572M15 12a3 3 0 01-3 3M17.657 16.657L13.414 12.414m-1.414-1.414l-4.243-4.243m-2.828-2.828l16.97 16.97"} />
                                        </svg>
                                        {showPdf ? 'Hide PDF' : 'Show PDF'}
                                    </button>
                                )}
                                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-neutral-100 transition-colors">
                                    Re-extract
                                </button>
                                <button onClick={handleSaveBlueprint} className="px-5 py-2 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors">
                                    Confirm & Continue
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {questions.map((q, idx) => (
                                <QuestionItem
                                    key={idx}
                                    question={q}
                                    onChange={(updated) => updateQuestion(idx, updated)}
                                    onDelete={() => deleteQuestion(idx)}
                                    isReadOnly={false}
                                />
                            ))}
                        </div>

                        <button
                            onClick={addQuestion}
                            className="w-full py-4 mt-6 border-2 border-dashed border-neutral-300 rounded-xl text-sm font-semibold text-text-muted hover:text-primary hover:border-primary hover:bg-primary-50 transition-colors"
                        >
                            + Add Question Manually
                        </button>
                    </div>

                    {/* Right Column: PDF Preview */}
                    {showPdf && pdfUrl && (
                        <div className="hidden lg:block">
                            <div className="sticky top-6 h-[calc(100vh-140px)] bg-neutral-900/5 rounded-2xl border border-neutral-200 overflow-hidden shadow-inner">
                                <div className="absolute top-0 left-0 right-0 bg-neutral-800 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex justify-between items-center z-10">
                                    <span>Question Source Preview</span>
                                    <button onClick={() => setShowPdf(false)} className="hover:text-red-400 transition-colors">
                                        HIDE
                                    </button>
                                </div>
                                <iframe
                                    src={`${pdfUrl}#toolbar=0`}
                                    className="w-full h-full pt-8"
                                    title="Question Source"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 3: Select Student */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-text-primary">Select Student for AI Grading</h3>
                            <p className="text-sm text-text-muted">Currently pairing answers from one student at a time.</p>
                        </div>
                        <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-neutral-100 transition-colors">
                            Back to Blueprint
                        </button>
                    </div>

                    {combinedSubmissions.length === 0 ? (
                        <div className="text-center py-12 bg-background border border-neutral-200 rounded-2xl">
                            <p className="text-sm text-text-muted">No students have submitted this assessment yet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col items-center justify-center gap-6 mb-8 bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-sm font-bold text-text-primary">Submission Content Type</p>
                                    <div className="flex items-center gap-1 bg-neutral-200/50 p-1 rounded-xl border border-neutral-200/50 shadow-sm">
                                        <button
                                            onClick={() => setIsScanned(true)}
                                            disabled={bulkPairingStatus.isRunning}
                                            className={`px-6 py-2 rounded-lg justify-center text-xs font-bold transition-all flex items-center gap-2 ${isScanned ? 'bg-white shadow-sm text-primary border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/20'} disabled:opacity-50`}
                                        >
                                            Scanned/Handwritten
                                        </button>
                                        <button
                                            onClick={() => setIsScanned(false)}
                                            disabled={bulkPairingStatus.isRunning}
                                            className={`px-6 py-2 rounded-lg justify-center text-xs font-bold transition-all flex items-center gap-2 ${!isScanned ? 'bg-white shadow-sm text-primary border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/20'} disabled:opacity-50`}
                                        >
                                            Digital/Code
                                        </button>
                                    </div>
                                </div>

                                <div className="h-px w-full max-w-xs bg-neutral-200" />

                                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                                    <button
                                        onClick={handlePairAll}
                                        disabled={isPairing || bulkPairingStatus.isRunning}
                                        className={`group relative px-8 py-3.5 rounded-2xl font-bold transition-all shadow-md active:scale-[0.98] disabled:scale-100 flex items-center gap-3 w-fit ${bulkPairingStatus.isRunning ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-white text-accent-600 hover:bg-accent-600 hover:text-white border border-accent-100 shadow-accent-600/10'}`}
                                    >
                                        {bulkPairingStatus.isRunning ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex gap-1.5">
                                                    <span className="w-2 h-2 bg-accent-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                    <span className="w-2 h-2 bg-accent-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                                                    <span className="w-2 h-2 bg-accent-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
                                                </div>
                                                <span className="text-accent-700">AI is Pairing...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 text-inherit group-hover:text-white transition-colors">
                                                <svg className="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <span className="truncate">Pair All Unpaired</span>
                                            </div>
                                        )}

                                        {!bulkPairingStatus.isRunning && (
                                            <div className="absolute -top-2 -right-2 bg-accent-600 text-white text-[10px] px-2 py-0.5 rounded-full border border-white shadow-sm font-bold">
                                                {combinedSubmissions.filter(s => !allPairings[s.id]).length}
                                            </div>
                                        )}
                                    </button>

                                    {bulkPairingStatus.isRunning && (
                                        <div className="w-full space-y-3 p-4 bg-white rounded-2xl border border-accent-100 shadow-sm shadow-accent-600/5">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-accent-600 uppercase tracking-widest">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        <span className="w-1.5 h-1.5 bg-accent-600 rounded-full animate-pulse"></span>
                                                        <span className="w-1.5 h-1.5 bg-accent-600 rounded-full animate-pulse"></span>
                                                    </div>
                                                    <span>Pairing {bulkPairingStatus.current} of {bulkPairingStatus.total}</span>
                                                </div>
                                                <span className="bg-accent-50 px-2 py-0.5 rounded-full border border-accent-100">{Math.round(((bulkPairingStatus.current - 1) / bulkPairingStatus.total) * 100)}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-accent-50 rounded-full overflow-hidden border border-accent-100 p-0.5">
                                                <div
                                                    className="h-full bg-accent-600 rounded-full transition-all duration-1000 ease-linear relative overflow-hidden"
                                                    style={{ width: `${Math.max(8, ((bulkPairingStatus.current - 1) / bulkPairingStatus.total) * 100)}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-shimmer" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-center text-text-muted font-medium italic">Processing student {bulkPairingStatus.current}... Please don't close this tab.</p>
                                        </div>
                                    )}
                                </div>
                            </div>


                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {combinedSubmissions.map((sub) => {
                                    const isAlreadyPaired = !!allPairings[sub.id];

                                    return (
                                        <div key={sub.id} className={`bg-background rounded-xl border transition-all flex flex-col justify-between ${isAlreadyPaired ? 'border-success/30 bg-success-50/10 shadow-sm' : 'border-neutral-200 hover:border-accent-300'} p-4`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                        {sub.user?.profile_picture ? (
                                                            <img src={sub.user.profile_picture} alt="Student" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-bold text-accent-500">{(sub.user?.name ?? '?')[0].toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-text-primary truncate">{sub.user?.name ?? 'Unknown Student'}</p>
                                                        <p className={`text-xs ${sub.status === 'LATE' ? 'text-amber-500' : 'text-text-muted'}`}>{sub.status}</p>
                                                    </div>
                                                </div>
                                                {isAlreadyPaired && (
                                                    <div className="flex items-center gap-1 bg-success-100 text-success text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        Paired
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handlePairStudent(sub.id)}
                                                    disabled={isPairing}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex justify-center items-center gap-2 ${isAlreadyPaired ? 'bg-success text-white hover:bg-success-hover' : 'bg-accent-50 text-accent-600 hover:bg-accent-100'}`}
                                                >
                                                    {isPairing && selectedSubmissionId === sub.id ? (
                                                        <><span className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> Pairing...</>
                                                    ) : isAlreadyPaired ? 'View Pairing' : 'Pair Answers'}
                                                </button>
                                                {isAlreadyPaired && (
                                                    <button
                                                        onClick={() => handlePairStudent(sub.id, true)}
                                                        disabled={isPairing}
                                                        className="px-2 py-1.5 rounded-lg border border-neutral-200 text-neutral-400 hover:text-accent-600 hover:border-accent-200 transition-all"
                                                        title="Re-run AI Pairing"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* STEP 4: Review Pairings */}
            {step === 4 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-background p-4 rounded-xl border border-neutral-200">
                        <div>
                            <h3 className="text-lg font-bold text-text-primary">Review Student Answers</h3>
                            <p className="text-sm text-text-muted">Review exactly what AI extracted as the student's answer. Edit if OCR missed something.</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            {combinedPdfUrl && (
                                <a
                                    href={combinedPdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-lg bg-neutral-100 text-text-secondary text-sm font-semibold hover:bg-neutral-200 transition-colors flex items-center gap-2 border border-neutral-200"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Combined Submission
                                </a>
                            )}
                            <button onClick={() => setStep(3)} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-neutral-100 transition-colors">
                                Back to Students
                            </button>
                            <button onClick={() => {/* Future: Send to respective math/text graders */ toast.success('Sent to graders (mock)!'); }} className="px-5 py-2 rounded-xl bg-accent-600 text-white text-sm font-semibold hover:bg-accent-700 transition-colors">
                                Submit for AI Grading
                            </button>
                        </div>
                    </div>

                    {pairedResults.map((resData, fileIdx) => (
                        <div key={fileIdx} className="space-y-4">
                            <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider bg-neutral-100 px-4 py-2 rounded-lg inline-block">
                                File: {resData.filename}
                            </h4>

                            {resData.error ? (
                                <p className="text-sm text-error p-4 bg-red-50 rounded-lg">Error processing file: {resData.error}</p>
                            ) : Array.isArray(resData.result) ? (
                                <div className="space-y-4">
                                    {resData.result.map((q, qIdx) => (
                                        <QuestionItem
                                            key={qIdx}
                                            question={q}
                                            onChange={(updated) => updatePairedQuestion(fileIdx, qIdx, updated)}
                                            isReadOnly={false}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-error">Result is not an array.</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
