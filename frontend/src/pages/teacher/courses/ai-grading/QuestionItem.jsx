import React from 'react';

export default function QuestionItem({
    question,
    onChange,
    onDelete,
    isReadOnly = false,
    hideRubric = false,
    onGenerateRubric = null,
    isGeneratingRubric = false
}) {
    const handleTextChange = (e) => {
        onChange({ ...question, text: e.target.value });
    };

    const handleLabelChange = (e) => {
        onChange({ ...question, label: e.target.value });
    };

    const handleTypeChange = (e) => {
        onChange({ ...question, type: e.target.value });
    };

    const handleAnswerModeChange = (e) => {
        onChange({ ...question, answer_mode: e.target.value });
    };

    const handleTotalMarksChange = (e) => {
        const val = e.target.value === '' ? '' : Number(e.target.value);
        onChange({ ...question, total_marks: val });
    };

    const handleStudentAnswerChange = (e) => {
        onChange({ ...question, student_answer: e.target.value });
    };

    const handleRubricChange = (rowIndex, colKey, value) => {
        const newRubric = [...(question.rubric || [])];
        newRubric[rowIndex] = { ...newRubric[rowIndex], [colKey]: value };
        onChange({ ...question, rubric: newRubric });
    };

    const addRubricRow = () => {
        const firstRow = question.rubric?.[0] || {};
        const newRow = { Criterion: "New Criterion" };
        Object.keys(firstRow).forEach(key => {
            if (key !== 'Criterion') newRow[key] = "";
        });
        onChange({ ...question, rubric: [...(question.rubric || []), newRow] });
    };

    const deleteRubricRow = (index) => {
        const newRubric = question.rubric.filter((_, i) => i !== index);
        onChange({ ...question, rubric: newRubric });
    };

    const handleRubricHeaderChange = (oldKey, newKey) => {
        if (!newKey || oldKey === newKey) return;
        const newRubric = (question.rubric || []).map(row => {
            const { [oldKey]: val, ...rest } = row;
            return { ...rest, [newKey]: val };
        });
        onChange({ ...question, rubric: newRubric });
    };

    const addRubricColumn = () => {
        const newKey = `Level ${Object.keys(question.rubric?.[0] || {}).length}`;
        const newRubric = (question.rubric || []).map(row => ({
            ...row,
            [newKey]: ""
        }));
        onChange({ ...question, rubric: newRubric });
    };

    const deleteRubricColumn = (key) => {
        const newRubric = (question.rubric || []).map(row => {
            const { [key]: _, ...rest } = row;
            return rest;
        });
        onChange({ ...question, rubric: newRubric });
    };

    const createManualRubric = () => {
        const initialRubric = [
            { Criterion: "Criterion 1", "Excellent": "", "Good": "", "Needs Improvement": "" }
        ];
        onChange({ ...question, rubric: initialRubric });
    };

    const addSubpart = () => {
        const newSubpart = {
            label: "",
            text: "",
            type: "TextQuestion",
            answer_mode: "text",
            total_marks: 1,
            subparts: [],
        };
        const newSubparts = [...(question.subparts || []), newSubpart];
        const newTotalMarks = newSubparts.reduce((sum, s) => sum + (Number(s.total_marks) || 0), 0);
        onChange({
            ...question,
            subparts: newSubparts,
            total_marks: newTotalMarks
        });
    };

    const updateSubpart = (index, updatedSubpart) => {
        const newSubparts = [...question.subparts];
        newSubparts[index] = updatedSubpart;
        const newTotalMarks = newSubparts.reduce((sum, s) => sum + (Number(s.total_marks) || 0), 0);
        onChange({ ...question, subparts: newSubparts, total_marks: newTotalMarks });
    };

    const deleteSubpart = (index) => {
        const newSubparts = question.subparts.filter((_, i) => i !== index);
        const newTotalMarks = newSubparts.reduce((sum, s) => sum + (Number(s.total_marks) || 0), 0);
        onChange({ ...question, subparts: newSubparts, total_marks: newTotalMarks });
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...(question.options || [])];
        if (typeof newOptions[index] !== 'object') {
            newOptions[index] = { label: '', text: '' };
        }
        newOptions[index] = { ...newOptions[index], [field]: value };
        onChange({ ...question, options: newOptions });
    };

    const addOption = () => {
        onChange({ ...question, options: [...(question.options || []), { label: '', text: '' }] });
    };

    const deleteOption = (index) => {
        const newOptions = (question.options || []).filter((_, i) => i !== index);
        onChange({ ...question, options: newOptions });
    };

    // Derived states
    const hasSubparts = question.subparts && question.subparts.length > 0;
    const canHaveAnswerMode = !hasSubparts; // Only leaf nodes have answer_mode semantics for student answers
    const hasStudentAnswer = question.student_answer !== undefined;

    return (
        <div className="mt-4 p-4 border-l-3 border-neutral-200 bg-background rounded-xl group relative">
            {/* Generate Rubric Button for Leaf Nodes (shown only if handler is provided) */}
            {!isReadOnly && !hasSubparts && onGenerateRubric && (
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0 flex gap-2">
                    <button
                        onClick={() => onGenerateRubric(question, (newRubric) => {
                            onChange({ ...question, rubric: newRubric });
                        })}
                        disabled={isGeneratingRubric}
                        className="px-4 py-2 bg-white border border-primary/20 rounded-xl text-[11px] font-black text-primary hover:bg-primary-50 transition-all shadow-xl shadow-primary/10 active:scale-95 flex items-center gap-2"
                    >
                        {isGeneratingRubric ? (
                            <span className="animate-spin w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full" />
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        )}
                        {question.rubric ? 'Regenerate AI Rubric' : 'Generate AI Rubric'}
                    </button>
                </div>
            )}

            <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">
                {/* Standard Inputs */}
                <div className="flex-1 space-y-3 min-w-[200px] w-full">
                    <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex flex-col w-24">
                            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 text-text-muted">Label</label>
                            <input
                                type="text"
                                value={question.label || ''}
                                onChange={handleLabelChange}
                                placeholder="e.g. 1a"
                                disabled={isReadOnly}
                                className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-50"
                            />
                        </div>
                        <div className="flex flex-col w-20">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Marks</label>
                                {hasSubparts && (
                                    <span title="Summed from subparts">
                                        <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 7h6m0 10v-3m-3 3h.01M9 17h1M9 13h1m3 0h1m-7 4h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                            <input
                                type="number"
                                value={question.total_marks === undefined ? '' : question.total_marks}
                                onChange={handleTotalMarksChange}
                                placeholder="0"
                                disabled={isReadOnly || hasSubparts}
                                min="0"
                                step="0.5"
                                className={`p-2 border rounded-lg text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-80 ${hasSubparts ? 'bg-primary-50 border-primary-100 font-bold text-primary italic' : 'bg-neutral-50 border-neutral-200'}`}
                            />
                        </div>
                        <div className="flex flex-col flex-1 min-w-[120px]">
                            <label className="text-[10px] font-bold uppercase tracking-wider mb-1 text-text-muted">Type</label>
                            <select
                                value={question.type || "TextQuestion"}
                                onChange={handleTypeChange}
                                disabled={isReadOnly}
                                className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-50"
                            >
                                <option value="TextQuestion">Text Question</option>
                                <option value="MCQ">Multiple Choice</option>
                                <option value="FillInBlank">Fill in Blank</option>
                            </select>
                        </div>
                        {canHaveAnswerMode && (
                            <div className="flex flex-col flex-1 min-w-[120px]">
                                <label className="text-[10px] font-bold uppercase tracking-wider mb-1 text-text-muted">Grading Mode</label>
                                <select
                                    value={question.answer_mode || "text"}
                                    onChange={handleAnswerModeChange}
                                    disabled={isReadOnly || hasStudentAnswer} // Disable answer_mode mapping if already paired
                                    className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-50"
                                >
                                    <option value="text">Subjective (Text)</option>
                                    <option value="math">Mathematical / Formula</option>
                                    <option value="coding">Programming / Code</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col w-full">
                        <label className="text-[10px] font-bold uppercase tracking-wider mb-1 text-text-muted">Question Text</label>
                        <textarea
                            value={question.text || ''}
                            onChange={handleTextChange}
                            placeholder="Enter question text..."
                            disabled={isReadOnly}
                            className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-text-primary min-h-[60px] resize-y focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Delete Button */}
                {!isReadOnly && (
                    <button
                        onClick={onDelete}
                        className="mt-6 p-2 text-text-muted hover:text-error hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                        title="Delete Question"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            {/* MCQ Options */}
            {question.type === "MCQ" && (
                <div className="mt-4 ml-6 pl-4 border-l-2 border-neutral-100">
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block text-text-muted">Options</label>
                    <div className="space-y-2">
                        {(question.options || []).map((option, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
                                <input
                                    type="text"
                                    value={option.label || ''}
                                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                                    placeholder="e.g. A"
                                    disabled={isReadOnly}
                                    className="w-16 p-2 bg-neutral-50 border border-neutral-200 rounded text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-50"
                                />
                                <input
                                    type="text"
                                    value={option.text || ''}
                                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                    placeholder={`Option ${index + 1} details`}
                                    disabled={isReadOnly}
                                    className="flex-1 p-2 bg-neutral-50 border border-neutral-200 rounded text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-50"
                                />
                                {!isReadOnly && (
                                    <button onClick={() => deleteOption(index)} className="p-1 text-text-muted hover:text-error transition-colors">
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        {!isReadOnly && (
                            <button onClick={addOption} className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors mt-2 ml-4">
                                + Add Option
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Student Answer Display/Editor Map (Shown if present and is leaf) */}
            {hasStudentAnswer && canHaveAnswerMode && (
                <div className="mt-4 bg-accent-50/50 border border-accent-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-accent-600">Student's Extracted Answer</label>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${question.answer_mode === 'math' ? 'bg-amber-100 text-amber-700 border-amber-200' : question.answer_mode === 'coding' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                            {question.answer_mode} Grader
                        </span>
                    </div>
                    {isReadOnly ? (
                        <div className="p-3 bg-background rounded-lg border border-neutral-200 text-sm text-text-primary whitespace-pre-wrap">
                            {question.student_answer || <span className="text-text-muted italic">No answer detected.</span>}
                        </div>
                    ) : (
                        <textarea
                            value={question.student_answer || ''}
                            onChange={handleStudentAnswerChange}
                            placeholder="Correct or input the extracted student answer here..."
                            className="w-full p-3 bg-background border border-accent-200 rounded-lg text-sm text-text-primary min-h-[80px] font-mono resize-y focus:border-accent-400 focus:ring-1 focus:ring-accent-400 outline-none transition-colors"
                        />
                    )}
                </div>
            )}

            {/* Recursive Subparts */}
            {hasSubparts && (
                <div className="mt-4 space-y-4">
                    {question.subparts.map((subpart, index) => (
                        <QuestionItem
                            key={index}
                            question={subpart}
                            onChange={(updated) => updateSubpart(index, updated)}
                            onDelete={() => deleteSubpart(index)}
                            isReadOnly={isReadOnly}
                            onGenerateRubric={onGenerateRubric}
                            isGeneratingRubric={isGeneratingRubric}
                            hideRubric={hideRubric}
                        />
                    ))}
                </div>
            )}

            {/* Rubric Section */}
            {!hideRubric && question.rubric && question.rubric.length > 0 ? (
                <div className="mt-4 border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-50/30">
                    <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary italic">Grading Rubric</span>
                            {!isReadOnly && (
                                <button
                                    onClick={addRubricColumn}
                                    className="text-[9px] font-bold text-primary bg-white px-2 py-0.5 rounded border border-primary/20 hover:bg-primary-50 transition-colors uppercase"
                                >
                                    + Add Level
                                </button>
                            )}
                        </div>
                        {!isReadOnly && (
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to delete the entire rubric?")) {
                                        onChange({ ...question, rubric: null });
                                    }
                                }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase"
                            >
                                Delete Rubric
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-white border-b border-neutral-200">
                                    <th className="p-3 text-[10px] font-bold uppercase text-text-muted border-r border-neutral-100 w-48">Criterion</th>
                                    {Object.keys(question.rubric[0]).filter(k => k !== 'Criterion').map(col => (
                                        <th key={col} className="p-3 text-[10px] font-bold uppercase text-text-muted border-r border-neutral-50 group/header relative">
                                            {!isReadOnly ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={col}
                                                        onChange={(e) => handleRubricHeaderChange(col, e.target.value)}
                                                        className="bg-transparent border-none focus:ring-1 focus:ring-primary/30 rounded p-0.5 w-full font-bold uppercase tracking-wider text-text-muted outline-none"
                                                    />
                                                    <button
                                                        onClick={() => deleteRubricColumn(col)}
                                                        className="opacity-0 group-hover/header:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                                                        title="Delete Level"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                col
                                            )}
                                        </th>
                                    ))}
                                    {!isReadOnly && <th className="w-10"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {question.rubric.map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-neutral-100 last:border-0 hover:bg-white transition-colors">
                                        <td className="p-2 border-r border-neutral-100">
                                            <input
                                                type="text"
                                                value={row.Criterion}
                                                onChange={(e) => handleRubricChange(rIdx, 'Criterion', e.target.value)}
                                                disabled={isReadOnly}
                                                placeholder="Criterion name..."
                                                className="w-full p-2 text-xs font-semibold bg-transparent focus:bg-white rounded outline-none"
                                            />
                                        </td>
                                        {Object.keys(row).filter(k => k !== 'Criterion').map(col => (
                                            <td key={col} className="p-2 border-r border-neutral-50 last:border-r-0">
                                                <textarea
                                                    value={row[col]}
                                                    onChange={(e) => handleRubricChange(rIdx, col, e.target.value)}
                                                    disabled={isReadOnly}
                                                    rows={3}
                                                    placeholder="Level description..."
                                                    className="w-full p-2 text-[11px] leading-relaxed bg-transparent focus:bg-white rounded outline-none resize-none"
                                                />
                                            </td>
                                        ))}
                                        {!isReadOnly && (
                                            <td className="p-2 text-center">
                                                <button onClick={() => deleteRubricRow(rIdx)} className="text-neutral-300 hover:text-red-500 transition-colors p-2">✕</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!isReadOnly && (
                        <div className="p-3 bg-white/50 border-t border-neutral-100 flex justify-between items-center">
                            <button onClick={addRubricRow} className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Criterion
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                !hideRubric && !isReadOnly && !hasSubparts && (
                    <div className="mt-4 p-6 border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center bg-neutral-50/50 group/manual">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-neutral-100 flex items-center justify-center mb-3 group-hover/manual:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-xs font-bold text-text-muted mb-4 uppercase tracking-widest">No Rubric Defined</p>
                        <button
                            onClick={createManualRubric}
                            className="text-xs font-black text-primary hover:bg-primary-50 px-4 py-2 rounded-xl border border-primary/20 transition-all active:scale-95 bg-white shadow-sm"
                        >
                            + Create Manual Rubric
                        </button>
                    </div>
                )
            )}

            {!isReadOnly && question.type !== "MCQ" && question.type !== "FillInBlank" && !hasStudentAnswer && (
                <button onClick={addSubpart} className="mt-3 text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
                    + Add Subpart
                </button>
            )}
        </div>
    );
}
