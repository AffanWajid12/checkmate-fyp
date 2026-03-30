import { useNavigate } from 'react-router-dom';
import { useEnrolledCourses } from '../../../hooks/useCourses';
import StudentSidebar from '../StudentSidebar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const TYPE_META = {
    QUIZ: { label: 'Quiz', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    ASSIGNMENT: { label: 'Assignment', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    EXAM: { label: 'Exam', color: 'bg-amber-50 text-amber-600 border-amber-200' },
};

const STATUS_META = {
    MISSING: { label: 'Missing', color: 'bg-red-50 text-red-600 border-red-200' },
    SUBMITTED: { label: 'Submitted', color: 'bg-green-50 text-green-600 border-green-200' },
    GRADED: { label: 'Graded', color: 'bg-primary-50 text-primary-600 border-primary-200' },
    LATE: { label: 'Late', color: 'bg-orange-50 text-orange-600 border-orange-200' },
};

// ─── Assignment Card ──────────────────────────────────────────────────────────

const AssignmentCard = ({ assessment, course }) => {
    const navigate = useNavigate();
    const typeMeta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;
    const submission = assessment.submissions?.[0]; // Current user's submission
    const isPastDue = assessment.due_date && new Date(assessment.due_date) < new Date();
    
    let status = 'MISSING';
    if (submission) {
        status = submission.status; // SUBMITTED, LATE, GRADED
    } else if (!isPastDue) {
        status = null; // No status yet, just due soon
    }
    
    const statusMeta = status ? STATUS_META[status] : null;

    return (
        <div
            onClick={() => navigate(`/student/courses/${course.id}/assessments/${assessment.id}`)}
            className="bg-background rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 flex flex-col gap-3 group"
        >
            {/* Header: Course + Type */}
            <div className="flex justify-between items-start gap-3">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest truncate">
                    {course.code}
                </p>
                <div className="flex gap-2">
                    {statusMeta && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusMeta.color}`}>
                            {statusMeta.label}
                        </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${typeMeta.color}`}>
                        {typeMeta.label}
                    </span>
                </div>
            </div>

            {/* Title */}
            <div>
                <h3 className="text-sm font-bold text-text-primary leading-tight group-hover:text-accent-600 transition-colors line-clamp-2">
                    {assessment.title}
                </h3>
            </div>

            {/* Footer: Due date */}
            <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                {assessment.due_date ? (
                    <span className={isPastDue && !submission ? 'text-error font-medium' : 'text-text-secondary'}>
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const CardSkeleton = () => (
    <div className="bg-background rounded-2xl border border-neutral-200 p-5 animate-pulse flex flex-col gap-3 h-[130px]">
        <div className="flex justify-between">
            <div className="h-3 w-16 bg-neutral-200 rounded" />
            <div className="h-4 w-16 bg-neutral-200 rounded-full" />
        </div>
        <div className="h-4 bg-neutral-200 rounded w-3/4 mt-1" />
        <div className="mt-auto pt-3 border-t border-neutral-100">
            <div className="h-3 bg-neutral-200 rounded w-1/3" />
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentAssignmentsOverview = () => {
    const { data: courses = [], isLoading } = useEnrolledCourses();

    // Flatten all assessments from all announcements across all courses
    const allAssessments = [];
    courses.forEach((c) => {
        const ann = c.announcements ?? [];
        ann.forEach((a) => {
            const asmts = a.assessments ?? [];
            asmts.forEach((asmt) => {
                allAssessments.push({ 
                    ...asmt, 
                    course: { id: c.id, code: c.code, title: c.title } 
                });
            });
        });
    });

    // Sort by due date (closest first)
    allAssessments.sort((a, b) => {
        if (!a.due_date && !b.due_date) return new Date(b.createdAt) - new Date(a.createdAt);
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
    });

    return (
        <div className="max-w-7xl mx-auto p-6 pb-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary">Assignments Overview</h1>
                <p className="text-sm text-text-secondary mt-1">
                    {isLoading
                        ? 'Loading assessments…'
                        : `Showing ${allAssessments.length} assessment${allAssessments.length !== 1 ? 's' : ''} across your ${courses.length} course${courses.length !== 1 ? 's' : ''}.`
                    }
                </p>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && allAssessments.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 border border-accent-100 flex items-center justify-center mb-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-accent-400">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-text-primary mb-1">No assessments found</h2>
                    <p className="text-sm text-text-secondary max-w-sm">
                        You don't have any quizzes, assignments, or exams in your courses yet.
                    </p>
                </div>
            )}

            {/* Assessment Grid */}
            {!isLoading && allAssessments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allAssessments.map((asmt) => (
                        <AssignmentCard key={asmt.id} assessment={asmt} course={asmt.course} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentAssignmentsOverview;
