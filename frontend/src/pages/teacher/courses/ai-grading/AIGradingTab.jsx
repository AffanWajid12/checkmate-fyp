import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// Step Components
import Step1_Extraction from './steps/Step1_Extraction';
import Step2_Blueprint from './steps/Step2_Blueprint';
import Step3_StudentSelection from './steps/Step3_StudentSelection';
import Step4_PairingReview from './steps/Step4_PairingReview';
import Step5_GradingSetup from './steps/Step5_GradingSetup';
import Step6_StudentGradingSelection from './steps/Step6_StudentGradingSelection';
import Step6_Results from './steps/Step6_Results'; // Note: Will rename component and logic later if needed
import GradingStepper from './components/GradingStepper';

// Hooks
import { 
    useExtractQuestions, 
    usePairStudentAnswers, 
    useGenerateRubric, 
    useGenerateRubricsBulk, 
    useGradeExam, 
    useUploadGradingResource, 
    useGetGradingResources, 
    useClearGradingResources 
} from '../../../../hooks/useCourses';

export default function AIGradingTab({ courseId, assessmentId, submitted, late, sourceMaterials }) {
    // --- Workflow State ---
    const [step, setStep] = useState(1);
    const [showPdf, setShowPdf] = useState(true);
    const [isScanned, setIsScanned] = useState(true);

    // --- Data State ---
    const [questions, setQuestions] = useState([]);
    const [allPairings, setAllPairings] = useState({}); // { [submissionId]: { results, combinedPdfUrl } }
    const [pairedResults, setPairedResults] = useState([]);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
    const [combinedPdfUrl, setCombinedPdfUrl] = useState(null);
    
    // --- Selection & Grading State ---
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [gradingConfig, setGradingConfig] = useState({
        textInstructions: "",
        mathInstructions: "",
        codingInstructions: ""
    });
    const [gradingResults, setGradingResults] = useState({}); // { [submissionId]: result }
    const [isGradingBulk, setIsGradingBulk] = useState(false);
    const [pairingStudentId, setPairingStudentId] = useState(null);
    const [globalRubricColumns, setGlobalRubricColumns] = useState(3);

    // --- Hooks ---
    const { mutate: extractQuestions, isPending: isExtracting } = useExtractQuestions(courseId, assessmentId);
    const { mutate: pairAnswers, mutateAsync: pairAnswersAsync, isPending: isPairing } = usePairStudentAnswers(courseId, assessmentId);
    const { mutate: generateRubric, isPending: isGeneratingRubric } = useGenerateRubric();
    const { mutate: generateRubricsBulk, isPending: isGeneratingRubricsBulk } = useGenerateRubricsBulk();
    const { mutateAsync: gradeExamAsync } = useGradeExam();

    const { mutate: uploadResource, isPending: isUploadingResource } = useUploadGradingResource();
    const { data: gradingResources = [] } = useGetGradingResources(assessmentId);
    const { mutate: clearResources } = useClearGradingResources();

    const pdfUrl = sourceMaterials?.find(m => m.mime_type === 'application/pdf')?.signed_url;
    const combinedSubmissions = [...(submitted || []), ...(late || [])];

    // --- Persistence ---
    useEffect(() => {
        // 1. Try restoring Grading Results (Step 7)
        const savedGradingResults = localStorage.getItem(`assessment_${assessmentId}_grading_results`);
        let hasResults = false;
        if (savedGradingResults) {
            try {
                const parsed = JSON.parse(savedGradingResults);
                setGradingResults(parsed);
                if (Object.keys(parsed).length > 0) hasResults = true;
            } catch (e) {}
        }

        // 2. Load Questions/Blueprint
        const savedQuestions = localStorage.getItem(`assessment_${assessmentId}_questions`);
        if (savedQuestions) {
            try {
                const parsed = JSON.parse(savedQuestions);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setQuestions(parsed);
                    
                    // 3. Load Pairings
                    const savedPairings = localStorage.getItem(`assessment_${assessmentId}_pairings`);
                    const parsedPairings = savedPairings ? JSON.parse(savedPairings) : {};
                    setAllPairings(parsedPairings);
                    const hasPairings = Object.keys(parsedPairings).length > 0;

                    // 4. Restore the correct Step
                    if (hasResults) {
                        setStep(7);
                    } else if (hasPairings) {
                        // If pairing exists, maybe we already configured setup or are in selection?
                        // For now, if pairings exist we go to Step 3. (Setup is step 5)
                        setStep(3); 
                    } else {
                        setStep(2);
                    }
                }
            } catch (e) {
                console.error("Failed to parse saved questions", e);
                setStep(1);
            }
        } else {
            setStep(1);
        }

        // 5. Load other config
        const savedGradingConfig = localStorage.getItem(`assessment_${assessmentId}_grading_config`);
        if (savedGradingConfig) {
            try { setGradingConfig(JSON.parse(savedGradingConfig)); } catch (e) {}
        }

        const savedRubricColumns = localStorage.getItem(`assessment_${assessmentId}_rubric_columns`);
        if (savedRubricColumns) {
            setGlobalRubricColumns(parseInt(savedRubricColumns));
        }
    }, [assessmentId]);

    const clearAllPairings = useCallback(() => {
        setAllPairings({});
        localStorage.removeItem(`assessment_${assessmentId}_pairings`);
        setGradingResults({});
        localStorage.removeItem(`assessment_${assessmentId}_grading_results`);
    }, [assessmentId]);

    const stripRubrics = (qs) => {
        return qs.map(q => {
            const { rubric, subparts, ...rest } = q;
            return {
                ...rest,
                subparts: subparts ? stripRubrics(subparts) : []
            };
        });
    };

    const getLeafQuestions = (qs, path_prefix = [], context_text = "") => {
        let leaves = [];
        qs.forEach((q, idx) => {
            const curPath = [...path_prefix, idx];
            const my_text = q.text || "";
            
            if (q.subparts && q.subparts.length > 0) {
                const new_context = (context_text + "\n" + my_text).trim();
                leaves = [...leaves, ...getLeafQuestions(q.subparts, curPath, new_context)];
            } else {
                const full_text = context_text ? `Context: ${context_text}\n\nQuestion: ${my_text}` : my_text;
                leaves.push({ ...q, text: full_text, path: curPath });
            }
        });
        return leaves;
    };

    /**
     * Reconstructs the full blueprint tree but populates it with student answers from the pairings.
     * This is crucial so that the Grading Backend sees the "Real" structure and returns paths 
     * that map correctly back to our blueprint.
     */
    const reconstructFullExam = (blueprint, pairedLeaves, path_prefix = []) => {
        return blueprint.map((q, idx) => {
            const curPath = [...path_prefix, idx];
            if (q.subparts && q.subparts.length > 0) {
                return {
                    ...q,
                    subparts: reconstructFullExam(q.subparts, pairedLeaves, curPath)
                };
            } else {
                const curPathStr = curPath.join('-');
                
                // Find all snippets that match this leaf
                const relevantMatches = pairedLeaves.filter(pl => {
                    // 1. Try exact path match (most reliable)
                    if (pl.path && Array.isArray(pl.path)) {
                        return pl.path.join('-') === curPathStr;
                    }

                    // 2. Fallback to fuzzy matching if path is missing from pairing result
                    const normalize = (txt) => String(txt || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
                    const blueLabelNorm = normalize(q.label);
                    const blueTextNorm = normalize(q.text).slice(0, 50);
                    
                    const pairLabelNorm = normalize(pl.label);
                    const pairTextNorm = normalize(pl.text).slice(0, 50);
                    
                    const labelMatches = blueLabelNorm && pairLabelNorm && blueLabelNorm === pairLabelNorm;
                    const textMatches = blueTextNorm && pairTextNorm && blueTextNorm === pairTextNorm;
                    
                    return labelMatches || textMatches;
                });

                // Join all answers found for this specific leaf node
                const aggregatedAnswer = relevantMatches
                    .map(m => m.student_answer || m.answer || "")
                    .filter(txt => txt.trim().length > 0)
                    .join("\n\n");

                return {
                    ...q,
                    answer: aggregatedAnswer || "",
                    question: q.text || "",
                    points: q.total_marks || 0
                };
            }
        });
    };

    // --- Handlers ---
    const handleExtract = () => {
        extractQuestions({ isScanned }, {
            onSuccess: (data) => {
                const extracted = data.questions || [];
                setQuestions(extracted);
                localStorage.setItem(`assessment_${assessmentId}_questions`, JSON.stringify(extracted));
                clearAllPairings();
                toast.success("Questions extracted successfully!");
                setStep(2);
            },
            onError: (err) => toast.error(err?.response?.data?.message || "Extraction failed.")
        });
    };

    const handleUpdateQuestion = (idx, updated) => {
        const newQuestions = [...questions];
        newQuestions[idx] = updated;
        setQuestions(newQuestions);
        clearAllPairings();
    };

    const handleDeleteQuestion = (idx) => {
        const newQuestions = questions.filter((_, i) => i !== idx);
        setQuestions(newQuestions);
        clearAllPairings();
    };

    const handleAddQuestion = () => {
        setQuestions([...questions, { label: (questions.length + 1).toString(), type: "TextQuestion", answer_mode: "text", total_marks: 1, text: "", options: [], subparts: [] }]);
        clearAllPairings();
    };

    const handlePairStudent = (submissionId, forceRePair = false) => {
        setSelectedSubmissionId(submissionId);
        if (!forceRePair && allPairings[submissionId]) {
            setPairedResults(allPairings[submissionId].results);
            setCombinedPdfUrl(allPairings[submissionId].combinedPdfUrl);
            setStep(4);
            return;
        }

        setPairingStudentId(submissionId);
        // Only send leaf questions to the pairing service to prevent pairing with parent containers
        const leaves = getLeafQuestions(questions);
        const cleanedQuestions = stripRubrics(leaves);
        
        pairAnswers({ submissionId, questions: cleanedQuestions, isScanned }, {
            onSuccess: (data) => {
                const results = data.results;
                const combinedUrl = data.combined_pdf_url;
                setPairedResults(results);
                setCombinedPdfUrl(combinedUrl);
                const newPairings = { ...allPairings, [submissionId]: { results, combinedPdfUrl: combinedUrl } };
                setAllPairings(newPairings);
                localStorage.setItem(`assessment_${assessmentId}_pairings`, JSON.stringify(newPairings));
                
                // Auto-select student for grading since they are now paired
                if (!selectedStudents.includes(submissionId)) {
                    setSelectedStudents(prev => [...prev, submissionId]);
                }
                
                setPairingStudentId(null);
                setStep(4);
                toast.success("Answers paired successfully!");
            },
            onError: (err) => {
                setPairingStudentId(null);
                toast.error("Pairing failed.");
            }
        });
    };

    const handleGradeSelected = async () => {
        if (selectedStudents.length === 0) return toast.error("Select at least one student.");
        setIsGradingBulk(true);
        let newGradingResults = { ...gradingResults };
        let gradedCount = 0;

        console.log("--> [GRADING-BULK] Starting for IDs:", selectedStudents);
        console.log("--> [GRADING-BULK] Available Pairings:", Object.keys(allPairings));

        for (const subId of selectedStudents) {
            const pairing = allPairings[subId];
            if (!pairing || !pairing.results) {
                console.warn(`--> [GRADING-SKIP] No pairing found for student ${subId}`);
                continue;
            }

            // Reconstruct the FULL question tree with student answers injected into the leaves.
            // This ensures the backend returns the correct depth-based paths (e.g. [0, 1]).
            const pairedLeaves = pairing.results.flatMap(r => r.result);
            const student_exam = reconstructFullExam(questions, pairedLeaves);

            try {
                const backendResult = await gradeExamAsync({
                    assessment_id: assessmentId,
                    student_exam,
                    strictness_level: "Strict (follow rubric precisely)",
                    additional_instructions: "Please be concise with feedback.",
                    text_instructions: gradingConfig.textInstructions,
                    math_instructions: gradingConfig.mathInstructions,
                    coding_instructions: gradingConfig.codingInstructions
                });

                // Helper to resolve a question from the blueprint nested tree using its index path
                const findQuestionByPath = (tree, path) => {
                    let current = tree;
                    for (let i = 0; i < path.length; i++) {
                        const idx = path[i];
                        if (i === path.length - 1) {
                            return current[idx];
                        } else {
                            current = current[idx]?.subparts || [];
                        }
                    }
                    return null;
                };

                // Transform backend flat dictionary into an aggregated object for the UI
                const questionsList = Object.entries(backendResult).map(([key, val]) => {
                    const path = val.path || [];
                    const baseQ = findQuestionByPath(questions, path);
                    
                    return {
                        ...val,
                        label: key.replace('q-', ''),
                        points: val.max_score,
                        answer: val.student_answer,
                        feedback: val.feedback,
                        // CRITICAL: Robustly resolve question text via Path, then Backend, then Fallback
                        question_text: baseQ?.text || val.question || "Question text not available",
                        type: val.type || baseQ?.type || 'TextQuestion',
                        options: val.options || baseQ?.options || []
                    };
                });
                
                const formattedResult = {
                    results: questionsList,
                    total_score: questionsList.reduce((acc, curr) => acc + curr.score, 0),
                    max_total_score: questionsList.reduce((acc, curr) => acc + curr.points, 0)
                };

                newGradingResults[subId] = formattedResult;
                gradedCount++;
                setGradingResults({ ...newGradingResults });
                localStorage.setItem(`assessment_${assessmentId}_grading_results`, JSON.stringify(newGradingResults));
            } catch (err) { 
                console.error(`Grading failed for ${subId}:`, err);
                toast.error(`Grading failed for ${subId}`); 
            }
        }
        
        setIsGradingBulk(false);
        if (gradedCount > 0) {
            setStep(7);
            toast.success(`Successfully graded ${gradedCount} students!`);
        } else {
            toast.error("No students could be graded. Ensure they are all paired first.");
        }
    };

    // --- Render ---
    return (
        <div className="space-y-6">
            <GradingStepper currentStep={step} onStepClick={setStep} />

            {step === 1 && (
                <Step1_Extraction 
                    onExtract={handleExtract}
                    isExtracting={isExtracting}
                    isScanned={isScanned}
                    setIsScanned={setIsScanned}
                    onSkip={() => setStep(2)}
                />
            )}

            {step === 2 && (
                <Step2_Blueprint 
                    questions={questions}
                    onUpdateQuestion={handleUpdateQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onAddQuestion={handleAddQuestion}
                    onConfirm={() => setStep(3)}
                    onBack={() => setStep(1)}
                    pdfUrl={pdfUrl}
                    showPdf={showPdf}
                    setShowPdf={setShowPdf}
                />
            )}

            {step === 3 && (
                <Step3_StudentSelection 
                    submissions={combinedSubmissions}
                    allPairings={allPairings}
                    onPairStudent={handlePairStudent}
                    onContinue={() => setStep(5)}
                    onBack={() => {
                        if (Object.keys(allPairings).length > 0) {
                            if (window.confirm("Going back to the Blueprint will clear all student pairing data. Continue?")) {
                                clearAllPairings();
                                setStep(2);
                            }
                        } else {
                            setStep(2);
                        }
                    }}
                    isScanned={isScanned}
                    setIsScanned={setIsScanned}
                    pairAnswersAsync={pairAnswersAsync}
                    questions={stripRubrics(getLeafQuestions(questions))}
                    assessmentId={assessmentId}
                    setAllPairings={setAllPairings}
                    selectedStudents={selectedStudents}
                    setSelectedStudents={setSelectedStudents}
                    toggleStudentSelection={(id) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    isPairing={isPairing}
                    pairingStudentId={pairingStudentId}
                />
            )}

            {step === 4 && (
                <Step4_PairingReview 
                    student={combinedSubmissions.find(s => s.id === selectedSubmissionId)}
                    pairedResults={pairedResults}
                    onUpdatePairedQuestion={(fileIdx, qIdx, updated) => {
                        const newResults = [...pairedResults];
                        newResults[fileIdx].result[qIdx] = updated;
                        setPairedResults(newResults);
                        if (selectedSubmissionId) {
                            const newAll = { ...allPairings, [selectedSubmissionId]: { ...allPairings[selectedSubmissionId], results: newResults } };
                            setAllPairings(newAll);
                            localStorage.setItem(`assessment_${assessmentId}_pairings`, JSON.stringify(newAll));
                        }
                    }}
                    onBack={() => setStep(3)}
                    onContinue={() => setStep(3)}
                    combinedPdfUrl={combinedPdfUrl}
                    selectedSubmissionId={selectedSubmissionId}
                    selectedStudents={selectedStudents}
                    setSelectedStudents={setSelectedStudents}
                />
            )}

            {step === 5 && (
                <Step5_GradingSetup 
                   gradingConfig={gradingConfig}
                   onUpdateConfig={(key, val) => {
                       const newCfg = { ...gradingConfig, [key]: val };
                       setGradingConfig(newCfg);
                       localStorage.setItem(`assessment_${assessmentId}_grading_config`, JSON.stringify(newCfg));
                   }}
                   onGenerateAllRubrics={() => {
                       // Pass full question tree so backend can walk subparts correctly
                       generateRubricsBulk({ student_exam: questions, columns: globalRubricColumns, force: true }, {
                           onSuccess: (data) => {
                               const updated = [...questions];
                               Object.entries(data.generated || {}).forEach(([pk, rubric]) => {
                                   // pk is like "q-0-1"
                                   const path = pk.split('-').slice(1).map(Number);
                                   let current = updated;
                                   let target = null;
                                   
                                   for (let i = 0; i < path.length; i++) {
                                       if (i === path.length - 1) {
                                           target = current[path[i]];
                                       } else {
                                           current = current[path[i]].subparts;
                                       }
                                   }
                                   
                                   if (target) target.rubric = rubric;
                               });
                               setQuestions(updated);
                               localStorage.setItem(`assessment_${assessmentId}_questions`, JSON.stringify(updated));
                               toast.success("Rubrics generated!");
                           }
                       });
                   }}
                   isGeneratingRubricsBulk={isGeneratingRubricsBulk}
                   onGradeSelected={() => setStep(6)} // Move to selection
                   isGradingBulk={isGradingBulk}
                   selectedStudentsCount={selectedStudents.length}
                   questions={questions}
                   onUpdateQuestion={handleUpdateQuestion}
                   onGenerateRubric={(q, onSuccess) => {
                        if (!q || !q.text || q.total_marks === undefined) {
                            return toast.error("Missing question text or marks.");
                        }
                        
                        generateRubric({ question: q.text, points: q.total_marks, columns: globalRubricColumns }, {
                            onSuccess: (data) => {
                                onSuccess(data.rubric);
                                toast.success("Rubric generated!");
                            }
                        });
                   }}
                   rubricColumns={globalRubricColumns}
                   onUpdateRubricColumns={(val) => {
                       setGlobalRubricColumns(val);
                       localStorage.setItem(`assessment_${assessmentId}_rubric_columns`, val.toString());
                   }}
                   isGeneratingRubric={isGeneratingRubric}
                   isUploadingResource={isUploadingResource}
                   resources={gradingResources}
                   onUploadResource={(file) => uploadResource({ assessmentId, file })}
                   onClearResources={() => clearResources(assessmentId)}
                />
            )}

            {step === 6 && (
                <Step6_StudentGradingSelection 
                    submissions={combinedSubmissions}
                    allPairings={allPairings}
                    selectedStudents={selectedStudents}
                    setSelectedStudents={setSelectedStudents}
                    onGradeSelected={handleGradeSelected}
                    isGradingBulk={isGradingBulk}
                    onBack={() => setStep(5)}
                    onJumpToStep={(s) => setStep(s)}
                />
            )}

            {step === 7 && (
                <Step6_Results 
                    gradingResults={gradingResults}
                    selectedStudents={selectedStudents}
                    submissions={combinedSubmissions}
                    onBack={() => setStep(6)}
                    onReset={() => {
                        setGradingResults({});
                        localStorage.removeItem(`assessment_${assessmentId}_grading_results`);
                        setStep(6);
                    }}
                />
            )}
        </div>
    );
}
