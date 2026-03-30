import { useNavigate } from 'react-router-dom';
import { useTeacherCourses, useDeleteAssessment } from '../../../hooks/useCourses';
import TeacherSidebar from '../TeacherSidebar';
import { TrashIcon } from '../courses/CoursePage/components/Icons';
import toast from 'react-hot-toast';

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

// ─── Assignment Card ──────────────────────────────────────────────────────────

const AssignmentCard = ({ assessment, course }) => {
    const navigate = useNavigate();
    const { mutateAsync: deleteAsmt, isPending: isDeleting } = useDeleteAssessment(course.id);
    const typeMeta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;
    const isPastDue = assessment.due_date && new Date(assessment.due_date) < new Date();

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
        <div
            onClick={() => navigate(`/teacher/courses/${course.id}/assessments/${assessment.id}`)}
            className="bg-background rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 flex flex-col gap-3 group relative"
        >
            {/* Header: Course + Type */}
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest truncate">
                        {course.code}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${typeMeta.color}`}>
                        {typeMeta.label}
                    </span>
                </div>
            </div>

            {/* Absolute Delete Button - Top Right */}
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="absolute -top-2 -right-2 p-2 rounded-xl bg-white shadow-sm border border-neutral-200 text-text-muted hover:text-error hover:border-error/20 hover:bg-error/5 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer z-10"
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

            {/* Title */}
            <div>
                <h3 className="text-sm font-bold text-text-primary leading-tight group-hover:text-accent-600 transition-colors line-clamp-2">
                    {assessment.title}
                </h3>
            </div>

            {/* Footer: Due date */}
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

const TeacherAssignmentsOverview = () => {
    const { data: courses = [], isLoading } = useTeacherCourses();

    // Flatten all assessments from all announcements across all courses
    const allAssessments = [];
    courses.forEach((c) => {
        const ann = c.announcements ?? [];
        ann.forEach((a) => {
            const asmts = a.assessments ?? [];
            asmts.forEach((asmt) => {
                allAssessments.push({ ...asmt, course: { id: c.id, code: c.code, title: c.title } });
            });
        });
    });

    // Sort by due date (newest first, or oldest first, or ones without due date last)
    allAssessments.sort((a, b) => {
        if (!a.due_date && !b.due_date) return new Date(b.createdAt) - new Date(a.createdAt);
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date) - new Date(a.due_date);
    });

    return (
        <TeacherSidebar>
            <div className="max-w-7xl mx-auto p-6 pb-20">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-text-primary">Assignments Overview</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {isLoading
                            ? 'Loading assessments…'
                            : `Showing ${allAssessments.length} assessment${allAssessments.length !== 1 ? 's' : ''} across ${courses.length} course${courses.length !== 1 ? 's' : ''}.`
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
                            You haven't posted any quizzes, assignments, or exams in your courses yet.
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
        </TeacherSidebar>
    );
};

export default TeacherAssignmentsOverview;
