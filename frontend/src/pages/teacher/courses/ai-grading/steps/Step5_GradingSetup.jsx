import React from 'react';
import TaughtResources from '../components/TaughtResources';
import QuestionItem from '../QuestionItem';

export default function Step5_GradingSetup({
    gradingConfig,
    onUpdateConfig,
    onGenerateAllRubrics,
    isGeneratingRubricsBulk,
    onGradeSelected,
    isGradingBulk,
    selectedStudentsCount,
    questions,
    onUpdateQuestion,
    onGenerateRubric,
    isGeneratingRubric,
    isUploadingResource,
    resources,
    onUploadResource,
    onClearResources,
    rubricColumns,
    onUpdateRubricColumns
}) {
    return (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-text-primary">Grading Setup</h3>
                        <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-black italic">Finalize criteria before AI takes over</p>
                    </div>
                        <div className="flex flex-col gap-1 items-end">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Rubric Levels</label>
                            <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                                {[2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => onUpdateRubricColumns(num)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${rubricColumns === num ? 'bg-black text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={onGenerateAllRubrics}
                            disabled={isGeneratingRubricsBulk}
                            className={`px-6 py-3 rounded-2xl border-2 font-black transition-all flex items-center gap-2 active:scale-95 ${isGeneratingRubricsBulk ? 'bg-neutral-50 text-neutral-400 border-neutral-100' : 'bg-white border-primary text-primary hover:bg-primary-50 shadow-lg shadow-primary/10'}`}
                        >
                            {isGeneratingRubricsBulk ? (
                                <><span className="animate-spin w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full" /> Auto-Generating...</>
                            ) : 'Auto-Generate All'}
                        </button>

                        <button
                            onClick={onGradeSelected} // This will now be onContinue in AIGradingTab
                            className="px-8 py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-2xl bg-primary text-white hover:bg-primary-hover active:scale-95 shadow-primary/40"
                        >
                            Continue
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                </div>

                {/* Sub-components */}
                <TaughtResources
                    isUploading={isUploadingResource}
                    resources={resources}
                    onUpload={onUploadResource}
                    onClear={onClearResources}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        { key: 'textInstructions', label: 'Humanities & Text', color: 'green', desc: 'Prioritize reasoning, grammar or structure' },
                        { key: 'mathInstructions', label: 'Math & Formulas', color: 'amber', desc: 'Check step-by-step logic vs final answer' },
                        { key: 'codingInstructions', label: 'Coding & Logic', color: 'blue', desc: 'Verify logic, syntax or efficiency' }
                    ].map(type => (
                        <div key={type.key} className="space-y-4 group">
                            <div>
                                <label className={`text-[10px] font-black uppercase tracking-[0.2em] text-${type.color}-600 block mb-1`}>
                                    {type.label}
                                </label>
                                <p className="text-[10px] text-text-muted font-bold mb-3">{type.desc}</p>
                            </div>
                            <textarea
                                value={gradingConfig[type.key]}
                                onChange={(e) => onUpdateConfig(type.key, e.target.value)}
                                placeholder={`Global instructions for ${type.label.toLowerCase()}...`}
                                className={`w-full p-6 bg-${type.color}-50/20 border border-neutral-200 resize-none rounded-3xl text-sm font-medium focus:ring-[1px] focus:ring-${type.color}-500/10 focus:border-${type.color}-400 outline-none min-h-[140px] transition-all duration-300 placeholder:${type.color}-900/30 shadow-inner group-hover:bg-white`}
                            />
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-text-primary uppercase tracking-[0.4em] border-b border-neutral-100 pb-4 flex items-center gap-3">
                        Individual Question Rubrics
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </h4>
                    <div className="grid grid-cols-1 gap-6">
                        {questions.map((q, idx) => (
                            <div key={idx} className="hover:scale-[1.002] transition-transform duration-300">
                                <QuestionItem
                                    question={q}
                                    onChange={(updated) => onUpdateQuestion(idx, updated)}
                                    isReadOnly={false}
                                    onGenerateRubric={onGenerateRubric}
                                    isGeneratingRubric={isGeneratingRubric}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
