import { useNavigate } from 'react-router-dom';
import { useCourseAnnouncements, useDeleteAssessment } from '../../../../../hooks/useCourses';
import { TrashIcon, PencilIcon } from '../components/Icons';
import toast from 'react-hot-toast';

const TYPE_META = {
    QUIZ: { label: 'Quiz', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    ASSIGNMENT: { label: 'Assignment', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    EXAM: { label: 'Exam', color: 'bg-amber-50 text-amber-600 border-amber-200' },
};

const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const AssessmentCard = ({ assessment, courseId }) => {
    const navigate = useNavigate();
    const { mutateAsync: deleteAssessment, isPending: isDeleting } = useDeleteAssessment(courseId);
    const typeMeta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;
    const isPastDue = assessment.due_date && new Date(assessment.due_date) < new Date();

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this assessment? All student submissions and attachments will be permanently deleted.')) {
            return;
        }

        try {
            await deleteAssessment(assessment.id);
            toast.success('Assessment deleted successfully');
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error(error.response?.data?.message || 'Failed to delete assessment');
        }
    };

    return (
        <div
            onClick={() => navigate(`/teacher/courses/${courseId}/assessments/${assessment.id}`)}
            className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 flex flex-col gap-3 group relative"
        >
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-text-primary leading-tight group-hover:text-accent-600 transition-colors line-clamp-2">
                        {assessment.title}
                    </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${typeMeta.color}`}>
                        {typeMeta.label}
                    </span>
                </div>
            </div>

            {/* Action Buttons - Top Right */}
            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teacher/courses/${courseId}/assessments/${assessment.id}`);
                    }}
                    className="p-2 rounded-xl bg-white shadow-sm border border-neutral-200 text-text-muted hover:text-accent-500 hover:border-accent-200 hover:bg-accent-50 transition-all cursor-pointer"
                    title="Edit Assessment"
                >
                    <PencilIcon size={14} />
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 rounded-xl bg-white shadow-sm border border-neutral-200 text-text-muted hover:text-error hover:border-error/20 hover:bg-error/5 transition-all disabled:opacity-50 cursor-pointer"
                    title="Delete Assessment"
                >
                    {isDeleting ? (
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <TrashIcon size={14} />
                    )}
                </button>
            </div>

            <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                {assessment.due_date ? (
                    <span className={isPastDue ? 'text-error font-medium' : 'text-text-secondary'}>
                        Due {formatDateTime(assessment.due_date)}
                    </span>
                ) : (
                    <span className="text-text-muted italic">No due date</span>
                )}
                <span className="text-accent-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                </span>
            </div>
        </div>
    );
};

const CardSkeleton = () => (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 animate-pulse flex flex-col gap-3 h-[120px]">
        <div className="flex justify-between">
            <div className="h-4 w-3/4 bg-neutral-200 rounded" />
            <div className="h-4 w-16 bg-neutral-200 rounded-full" />
        </div>
        <div className="mt-auto pt-3 border-t border-neutral-100">
            <div className="h-3 bg-neutral-200 rounded w-1/3" />
        </div>
    </div>
);

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const AssessmentsTab = ({ courseId }) => {
    const navigate = useNavigate();
    const { data: announcements = [], isLoading, isError } = useCourseAnnouncements(courseId);

    // Flatten all assessments from all announcements
    const allAssessments = [];
    announcements.forEach((ann) => {
        (ann.assessments ?? []).forEach((a) => allAssessments.push(a));
    });

    // Sort by due date (nearest first), no-due-date last
    allAssessments.sort((a, b) => {
        if (!a.due_date && !b.due_date) return new Date(b.createdAt) - new Date(a.createdAt);
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
    });

    return (
        <div className="space-y-4">
            {/* Header + Add button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-text-primary">Assessments</h2>
                    {!isLoading && (
                        <p className="text-xs text-text-muted mt-0.5">
                            {allAssessments.length} assessment{allAssessments.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => navigate(`/teacher/courses/${courseId}/add-assessment`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                    <PlusIcon />
                    New Assessment
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
            )}

            {/* Error */}
            {isError && (
                <div className="flex flex-col items-center justify-center min-h-[20vh] text-center px-6">
                    <p className="text-sm text-error bg-error/10 px-4 py-2 rounded-xl">
                        Failed to load assessments. Please try again later.
                    </p>
                </div>
            )}

            {/* Empty */}
            {!isLoading && allAssessments.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[20vh] text-center px-6">
                    <p className="text-sm text-text-secondary">
                        No assessments yet. Create one to start collecting submissions.
                    </p>
                </div>
            )}

            {/* Assessment Grid */}
            {!isLoading && allAssessments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allAssessments.map((a) => (
                        <AssessmentCard key={a.id} assessment={a} courseId={courseId} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssessmentsTab;
