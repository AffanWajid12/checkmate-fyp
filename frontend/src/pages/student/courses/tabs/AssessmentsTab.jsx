import { useNavigate } from 'react-router-dom';
import { useCourseAnnouncements } from '../../../../hooks/useCourses';

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
    const typeMeta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;
    const isPastDue = assessment.due_date && new Date(assessment.due_date) < new Date();

    return (
        <div
            onClick={() => navigate(`/student/courses/${courseId}/assessments/${assessment.id}`)}
            className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 flex flex-col gap-3 group"
        >
            <div className="flex justify-between items-start gap-3">
                <h3 className="text-sm font-bold text-text-primary leading-tight group-hover:text-accent-600 transition-colors line-clamp-2">
                    {assessment.title}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider flex-shrink-0 ${typeMeta.color}`}>
                    {typeMeta.label}
                </span>
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

const AssessmentsTab = ({ courseId }) => {
    const { data: announcements = [], isLoading } = useCourseAnnouncements(courseId);

    const allAssessments = [];
    announcements.forEach((ann) => {
        (ann.assessments ?? []).forEach((a) => allAssessments.push(a));
    });

    allAssessments.sort((a, b) => {
        if (!a.due_date && !b.due_date) return new Date(b.createdAt) - new Date(a.createdAt);
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
    });

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-base font-bold text-text-primary">Assessments</h2>
                {!isLoading && (
                    <p className="text-xs text-text-muted mt-0.5">
                        {allAssessments.length} assessment{allAssessments.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
            )}

            {!isLoading && allAssessments.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[20vh] text-center px-6">
                    <p className="text-sm text-text-secondary">No assessments yet.</p>
                </div>
            )}

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
