// ─── Assessment Chip ──────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { TYPE_META, formatDueDate } from '../utils/helpers';
import { ArrowRightIcon, TrashIcon } from './Icons';
import { useDeleteAssessment } from '../../../../../hooks/useCourses';
import toast from 'react-hot-toast';

export const AssessmentChip = ({ assessment, courseId }) => {
    const navigate = useNavigate();
    const { mutateAsync: deleteAsmt, isPending: isDeleting } = useDeleteAssessment(courseId);
    const meta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this assessment? All student submissions and attachments will be permanently deleted.')) {
            return;
        }

        try {
            await deleteAsmt(assessment.id);
            toast.success('Assessment deleted successfully');
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error(error.response?.data?.message || 'Failed to delete assessment');
        }
    };

    return (
        <div className="group/chip inline-flex items-center gap-1.5">
            <button
                onClick={() => navigate(`/teacher/courses/${courseId}/assessments/${assessment.id}`)}
                className="group/btn inline-flex items-center gap-2 text-xs font-medium bg-accent-50 text-accent-500 border border-accent-100 px-3 py-1.5 rounded-full hover:bg-accent-100 transition-colors"
            >
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.color}`}>
                    {meta.label}
                </span>
                <span>{assessment.title}</span>
                {assessment.due_date && (
                    <span className="text-text-muted hidden sm:inline">· Due {formatDueDate(assessment.due_date)}</span>
                )}
                <ArrowRightIcon />
            </button>
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-full text-text-muted hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover/chip:opacity-100 disabled:opacity-50 cursor-pointer border border-transparent hover:border-error/20"
                title="Delete Assessment"
            >
                {isDeleting ? (
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                ) : (
                    <TrashIcon size={12} />
                )}
            </button>
        </div>
    );
};
