// ─── Assessment Chip ──────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import { TYPE_META, formatDueDate } from '../utils/helpers';
import { ArrowRightIcon } from './Icons';

export const AssessmentChip = ({ assessment, courseId }) => {
    const navigate = useNavigate();
    const meta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;
    return (
        <button
            onClick={() => navigate(`/teacher/courses/${courseId}/assessments/${assessment.id}`)}
            className="group inline-flex items-center gap-2 text-xs font-medium bg-accent-50 text-accent-500 border border-accent-100 px-3 py-1.5 rounded-full hover:bg-accent-100 transition-colors"
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
    );
};
