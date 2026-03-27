import React from 'react';

export default function QuestionItem({ question, onChange, onDelete, isReadOnly = false }) {
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
        <div className="mt-4 p-4 border-l-3 border-neutral-200 bg-background rounded-xl group">
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
                        />
                    ))}
                </div>
            )}

            {!isReadOnly && question.type !== "MCQ" && question.type !== "FillInBlank" && !hasStudentAnswer && (
                <button onClick={addSubpart} className="mt-3 text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
                    + Add Subpart
                </button>
            )}
        </div>
    );
}
