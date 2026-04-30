import React, { useState } from 'react';
import BlueprintManager from './BlueprintManager';
import GradingPanel from './GradingPanel';
import { InlineResourceViewer } from '../../../../components/InlineResourceViewer';
import { useResetEvaluation } from '../../../../hooks/useCourses';
import toast from 'react-hot-toast';

export default function ManualEvaluationTab({ courseId, assessment, submitted = [], late = [], notSubmitted = [] }) {
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [isEditingBlueprint, setIsEditingBlueprint] = useState(false);
    const { mutateAsync: resetEvaluation, isPending: isResetting } = useResetEvaluation(courseId, assessment.id);
    const [selectedAttachmentIdx, setSelectedAttachmentIdx] = useState(0);

    // Combine all students. For those who haven't submitted, create a placeholder "submission" object.
    const allSubmissions = [
        ...submitted, 
        ...late,
        ...notSubmitted.map(user => ({
            id: `placeholder-${user.id}`,
            user_id: user.id,
            user: user,
            status: 'NOT_SUBMITTED',
            attachments: []
        }))
    ];

    const selectedSubmission = allSubmissions.find(s => s.user_id === selectedStudentId);

    // Reset attachment index when student changes
    React.useEffect(() => {
        setSelectedAttachmentIdx(0);
    }, [selectedStudentId]);

    const handleSelectStudent = (id) => {
        setSelectedStudentId(id);
    };

    const handleReset = async () => {
        if (!window.confirm("WARNING: This will permanently delete ALL evaluations/grades for this assessment and reset the blueprint. This cannot be undone. Are you sure?")) {
            return;
        }

        try {
            await resetEvaluation();
            toast.success("Manual evaluation has been reset.");
            setIsEditingBlueprint(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to reset evaluation.");
        }
    };

    // If there's no blueprint OR we're explicitly editing it, show the manager
    if (!assessment?.grading_blueprint || isEditingBlueprint) {
        return (
            <div className="p-6">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight">
                            {assessment?.grading_blueprint ? 'Edit Grading Blueprint' : 'Grading Blueprint Required'}
                        </h2>
                        <p className="text-sm text-text-muted mt-1">
                            {assessment?.grading_blueprint
                                ? 'Modify the marks or structure of this assessment.'
                                : 'Before you can manually evaluate submissions, you need to define the grading structure.'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {assessment?.grading_blueprint && (
                            <button
                                onClick={handleReset}
                                disabled={isResetting}
                                className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                                {isResetting ? 'Resetting...' : 'Reset All Evaluation'}
                            </button>
                        )}
                        {assessment?.grading_blueprint && (
                            <button
                                onClick={() => setIsEditingBlueprint(false)}
                                className="px-4 py-2 bg-white border border-neutral-200 text-text-primary rounded-xl text-sm font-bold hover:bg-neutral-50 transition-colors"
                            >
                                Cancel & Back to Grading
                            </button>
                        )}
                    </div>
                </div>
                <BlueprintManager
                    courseId={courseId}
                    assessment={assessment}
                    onClose={() => setIsEditingBlueprint(false)}
                />
            </div>
        );
    }


    return (
        <div className="flex flex-col gap-6 p-6 bg-neutral-50/30">
            {/* Header & Student Selector */}
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-2xl font-black text-text-primary tracking-tight">Submissions <span className="text-neutral-400">({allSubmissions.length})</span></h3>
                        <p className="text-sm font-bold text-text-muted mt-1 uppercase tracking-widest text-[10px]">Select a student to evaluate</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleReset}
                            disabled={isResetting}
                            className="px-4 py-2 bg-white border border-neutral-200 text-red-500 rounded-2xl text-xs font-black hover:bg-red-50 hover:border-red-100 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Reset All
                        </button>
                        <button 
                            onClick={() => setIsEditingBlueprint(true)}
                            className="px-4 py-2 bg-white border border-neutral-200 text-text-primary rounded-2xl text-xs font-black hover:bg-neutral-50 hover:border-primary/20 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                        >
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Blueprint
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-2 px-2">
                    {allSubmissions.map((sub) => {
                        const isSelected = sub.user_id === selectedStudentId;
                        const isGraded = sub.status === 'GRADED' || sub.evaluation;

                        return (
                            <button
                                key={sub.id}
                                onClick={() => handleSelectStudent(sub.user_id)}
                                className={`flex-shrink-0 w-48 flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all duration-300 ${isSelected
                                    ? 'bg-neutral-900 border-neutral-900 text-white shadow-xl translate-y-[-4px]'
                                    : 'bg-white border-neutral-200 text-text-secondary hover:border-primary/40 hover:translate-y-[-2px] shadow-sm'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shadow-sm ring-2 ${isSelected ? 'bg-white/20 ring-white/20 text-white' : 'bg-neutral-100 ring-neutral-50 text-neutral-400'}`}>
                                    {sub.user?.profile_picture ? (
                                        <img src={sub.user.profile_picture} alt="" className="w-full h-full rounded-xl object-cover" />
                                    ) : (
                                        (sub.user?.name || '?')[0].toUpperCase()
                                    )}
                                </div>
                                <div className="text-left overflow-hidden">
                                    <div className={`text-sm font-black leading-tight truncate ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                                        {sub.user?.name}
                                    </div>
                                    <div className={`text-[9px] font-black uppercase tracking-[0.1em] mt-1 ${
                                        isSelected ? 'text-white/50' : 
                                        isGraded ? 'text-success' : 
                                        sub.status === 'NOT_SUBMITTED' ? 'text-red-500' : 
                                        'text-amber-500'
                                    }`}>
                                        {isGraded ? 'Graded' : sub.status === 'NOT_SUBMITTED' ? 'Missing' : 'Pending'}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex gap-6 h-[calc(100vh-60px)] min-h-[600px]">
                {/* Left Panel: Viewer */}
                <div className="w-[55%] flex flex-col bg-white overflow-hidden border border-neutral-200 shadow-xl relative group rounded-2xl">
                    {selectedSubmission ? (
                        <div className="flex flex-col h-full">
                            {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 ? (
                                <>
                                    {/* Attachment Selector Tabs */}
                                    {selectedSubmission.attachments.length > 1 && (
                                        <div className="p-4 bg-white border-b border-neutral-100 flex gap-2 overflow-x-auto custom-scrollbar">
                                            {selectedSubmission.attachments.map((att, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedAttachmentIdx(idx)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${selectedAttachmentIdx === idx
                                                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg'
                                                        : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
                                                        }`}
                                                >
                                                    <svg className={`w-3.5 h-3.5 ${selectedAttachmentIdx === idx ? 'text-primary' : 'text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    {att.file_name.length > 15 ? att.file_name.slice(0, 12) + '...' : att.file_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex-1 relative">
                                        <InlineResourceViewer
                                            resource={selectedSubmission.attachments[selectedAttachmentIdx]}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-neutral-50/30">
                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-neutral-100">
                                        <svg className="w-10 h-10 text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-black text-text-primary">No Attachments Found</p>
                                    <p className="text-xs text-text-muted mt-2 max-w-[200px]">The student has not uploaded any documents for this submission.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-neutral-50/50">
                            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-neutral-200/50 ring-1 ring-neutral-100">
                                <svg className="w-12 h-12 text-primary/20 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-black text-text-primary tracking-tight">Select a Submission</h4>
                            <p className="text-sm text-text-muted mt-2 max-w-[250px] font-bold">Pick a student from the list above to start the manual grading process.</p>
                        </div>
                    )}
                </div>

                {/* Right Panel: Grading */}
                <div className="w-[45%] bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-xl flex flex-col">
                    {selectedSubmission ? (
                        <GradingPanel
                            courseId={courseId}
                            assessment={assessment}
                            submission={selectedSubmission}
                            onEditBlueprint={() => setIsEditingBlueprint(true)}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-neutral-50/30">
                            <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Grading Panel Locked</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
