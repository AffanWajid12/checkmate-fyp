import React, { useState, useEffect } from 'react';
import { useExtractQuestions, useSaveBlueprint } from '../../../../hooks/useCourses';
import toast from 'react-hot-toast';

const QuestionNode = ({ node, path, onUpdate, onRemove, onAddSubpart, depth = 0 }) => {
    const hasSubparts = node.subparts && node.subparts.length > 0;

    return (
        <div className={`space-y-3 ${depth > 0 ? 'ml-8 mt-3 pl-4 border-l-2 border-neutral-200' : ''}`}>
            <div className={`flex gap-4 p-4 rounded-2xl border transition-all ${depth === 0 ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-50/50 border-neutral-100'}`}>
                <div className="w-16">
                    <label className="block text-[8px] font-black text-neutral-400 uppercase mb-1 tracking-widest">Label</label>
                    <input
                        value={node.label}
                        onChange={(e) => onUpdate(path, 'label', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-[8px] font-black text-neutral-400 uppercase mb-1 tracking-widest">Question Text</label>
                    <input
                        value={node.question_text}
                        onChange={(e) => onUpdate(path, 'question_text', e.target.value)}
                        placeholder="Enter question text..."
                        className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>
                {!hasSubparts && (
                    <div className="w-20 text-right">
                        <label className="block text-[8px] font-black text-neutral-400 uppercase mb-1 tracking-widest">Marks</label>
                        <input
                            type="number"
                            value={node.points}
                            onChange={(e) => onUpdate(path, 'points', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm font-black text-primary text-right focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                )}
                <div className="flex gap-1 self-center">
                    <button
                        onClick={() => onAddSubpart(path)}
                        className="p-2 text-neutral-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        title="Add Subpart"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button
                        onClick={() => onRemove(path)}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Remove"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>

            {hasSubparts && (
                <div className="space-y-3">
                    {node.subparts.map((child, idx) => (
                        <QuestionNode
                            key={child.id || idx}
                            node={child}
                            path={[...path, idx]}
                            onUpdate={onUpdate}
                            onRemove={onRemove}
                            onAddSubpart={onAddSubpart}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function BlueprintManager({ courseId, assessment, onClose }) {
    const [isExtracting, setIsExtracting] = useState(false);
    const [isScanned, setIsScanned] = useState(false);
    const [extractedStructure, setExtractedStructure] = useState(assessment?.grading_blueprint?.structure || null);
    const [totalMarks, setTotalMarks] = useState(assessment?.grading_blueprint?.total_marks || 0);

    const { mutateAsync: extractQuestions } = useExtractQuestions(courseId, assessment.id);
    const { mutateAsync: saveBlueprint, isPending: isSaving } = useSaveBlueprint(courseId, assessment.id);

    // Auto-calculate total whenever structure changes
    useEffect(() => {
        if (extractedStructure) {
            const calculateTotal = (nodes) => {
                let total = 0;
                nodes.forEach(node => {
                    if (node.subparts && node.subparts.length > 0) {
                        total += calculateTotal(node.subparts);
                    } else {
                        total += parseFloat(node.points) || 0;
                    }
                });
                return total;
            };
            setTotalMarks(calculateTotal(extractedStructure));
        }
    }, [extractedStructure]);

    const handleExtract = async () => {
        setIsExtracting(true);
        try {
            const toastId = toast.loading('Extracting assessment structure via AI...', { duration: 15000 });
            const response = await extractQuestions({ isScanned });

            if (response?.questions || Array.isArray(response)) {
                const mapStructure = (nodes, parentLabel = '') => {
                    return nodes.map((node, idx) => {
                        const label = node.label || (parentLabel ? `${parentLabel}.${idx + 1}` : `Q${idx + 1}`);
                        return {
                            id: node.id || `q-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
                            label: label,
                            points: parseFloat(node.total_marks || node.points || 0),
                            question_text: node.text || node.question_text || '',
                            type: node.type || 'TextQuestion',
                            subparts: node.subparts && node.subparts.length > 0 ? mapStructure(node.subparts, label) : []
                        };
                    });
                };

                const questions = mapStructure(response.questions || response);
                setExtractedStructure(questions);
                toast.success('Blueprint extracted! Please review and confirm below.', { id: toastId });
            } else {
                toast.error('Failed to extract questions.', { id: toastId });
            }
        } catch (error) {
            toast.error('An error occurred during extraction.');
        } finally {
            setIsExtracting(false);
        }
    };

    const updateQuestion = (path, field, value) => {
        const newStructure = JSON.parse(JSON.stringify(extractedStructure));
        let current = newStructure;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]].subparts;
        }
        current[path[path.length - 1]][field] = value;
        setExtractedStructure(newStructure);
    };

    const addQuestion = () => {
        const newQ = { id: Date.now(), label: `Q${extractedStructure.length + 1}`, points: 1, question_text: '', type: 'manual', subparts: [] };
        setExtractedStructure([...extractedStructure, newQ]);
    };

    const addSubpart = (path) => {
        const newStructure = JSON.parse(JSON.stringify(extractedStructure));
        let current = newStructure;
        for (let i = 0; i < path.length; i++) {
            current = current[path[i]];
        }
        if (!current.subparts) current.subparts = [];
        current.subparts.push({
            id: Date.now(),
            label: `${current.label}.${current.subparts.length + 1}`,
            points: 1,
            question_text: '',
            type: 'manual',
            subparts: []
        });
        setExtractedStructure(newStructure);
    };

    const removeQuestion = (path) => {
        const newStructure = JSON.parse(JSON.stringify(extractedStructure));
        if (path.length === 1) {
            setExtractedStructure(newStructure.filter((_, i) => i !== path[0]));
        } else {
            let current = newStructure;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]].subparts;
            }
            current.splice(path[path.length - 1], 1);
            setExtractedStructure(newStructure);
        }
    };

    const handleSave = async () => {
        try {
            await saveBlueprint({
                total_marks: totalMarks,
                structure: extractedStructure
            });
            toast.success('Blueprint saved successfully!');
            if (onClose) onClose();
        } catch (error) {
            toast.error('Failed to save blueprint.');
        }
    };

    if (extractedStructure) {
        return (
            <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-2xl overflow-hidden max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                <div className="p-8 border-b border-neutral-200 bg-neutral-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-text-primary tracking-tight">Review Blueprint</h3>
                        <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">Verify and adjust marks for each question</p>
                    </div>
                    <div className="text-right bg-white px-6 py-3 rounded-3xl border border-neutral-200 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Marks</p>
                        <p className="text-3xl font-black text-primary tabular-nums tracking-tighter">{totalMarks}</p>
                    </div>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6 bg-neutral-50/20">
                    {extractedStructure.map((q, idx) => (
                        <QuestionNode
                            key={q.id || idx}
                            node={q}
                            path={[idx]}
                            onUpdate={updateQuestion}
                            onRemove={removeQuestion}
                            onAddSubpart={addSubpart}
                        />
                    ))}

                    <button
                        onClick={addQuestion}
                        className="w-full py-5 border-2 border-dashed border-neutral-200 rounded-[2rem] text-sm font-black text-neutral-400 hover:border-primary hover:text-primary hover:bg-primary/5 hover:scale-[1.01] transition-all active:scale-95"
                    >
                        + Add Question Manually
                    </button>
                </div>

                <div className="p-8 bg-white border-t border-neutral-200 flex justify-between items-center gap-6">
                    <button
                        onClick={() => setExtractedStructure(null)}
                        className="px-6 py-3 text-sm font-black text-text-muted hover:text-text-primary transition-colors"
                    >
                        Start Over
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-10 py-4 bg-neutral-900 text-white rounded-[1.5rem] text-sm font-black shadow-xl shadow-black/20 hover:bg-black hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? 'Saving Blueprint...' : 'Confirm & Save Blueprint'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-neutral-50 rounded-[3rem] border border-neutral-200 p-12 text-center max-w-2xl mx-auto shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-12 -translate-y-12 blur-3xl" />
            <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mx-auto mb-8 ring-1 ring-neutral-100">
                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h3 className="text-3xl font-black text-text-primary tracking-tight mb-3">Configure Grading Blueprint</h3>
            <p className="text-sm font-bold text-text-muted mb-10 leading-relaxed max-w-sm mx-auto">
                Extract the assessment structure automatically using AI, or initialize the manual structure to get started.
            </p>

            <div className="flex flex-col gap-6 max-w-sm mx-auto">
                <div className="space-y-2">
                    <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest text-left ml-2">Document Type</label>
                    <select
                        value={isScanned ? 'scanned' : 'digital'}
                        onChange={(e) => setIsScanned(e.target.value === 'scanned')}
                        className="w-full px-6 py-4 bg-white border border-neutral-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer shadow-sm"
                    >
                        <option value="digital">Digital / Text-based PDF</option>
                        <option value="scanned">Scanned / Handwritten PDF</option>
                    </select>
                </div>

                <button
                    onClick={handleExtract}
                    disabled={isExtracting}
                    className="w-full py-4.5 px-8 bg-neutral-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                >
                    {isExtracting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Extracting...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Auto-Extract Structure
                        </>
                    )}
                </button>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-neutral-50 px-4 text-text-muted font-black tracking-widest">Or</span></div>
                </div>

                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const marks = parseFloat(formData.get('marks')) || 0;
                        if (marks > 0) {
                            setExtractedStructure([{ 
                                id: Date.now(), 
                                label: 'Q1', 
                                points: marks, 
                                question_text: 'Question 1', 
                                type: 'manual',
                                subparts: []
                            }]);
                            setTotalMarks(marks);
                        }
                    }}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest text-left ml-2">Total Marks</label>
                        <input 
                            name="marks"
                            type="number" 
                            placeholder="e.g. 50" 
                            required
                            className="w-full px-6 py-4 bg-white border border-neutral-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm" 
                        />
                    </div>
                    <button type="submit" className="w-full py-4 bg-white border-2 border-neutral-200 text-text-primary rounded-2xl text-sm font-black hover:bg-neutral-50 hover:border-neutral-300 transition-all active:scale-95 shadow-sm">
                        Initialize Manually
                    </button>
                </form>
            </div>
        </div>
    );
}
