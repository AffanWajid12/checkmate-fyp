import { useNavigate } from 'react-router-dom';
import { useTeacherCourses } from '../../../hooks/useCourses';
import TeacherSidebar from '../TeacherSidebar';

// ─── Icons ────────────────────────────────────────────────────────────────────

const CodeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const ClockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
    if (!iso) return 'No deadline';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

// ─── Assessment Card ──────────────────────────────────────────────────────────

const CodingAssessmentCard = ({ assessment, courseId, courseName }) => {
    const navigate = useNavigate();
    const isOverdue = assessment.due_date && new Date(assessment.due_date) < new Date();

    return (
        <div
            onClick={() => navigate(`/teacher/courses/${courseId}/assessments/${assessment.id}`)}
            className="bg-background border border-neutral-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                        <CodeIcon />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary truncate">{assessment.title}</p>
                        <p className="text-xs text-text-muted truncate">{courseName}</p>
                    </div>
                </div>
                <div className="text-text-muted group-hover:text-emerald-500 transition-colors flex-shrink-0">
                    <ChevronRightIcon />
                </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
                {assessment.coding_assessment?.language && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {assessment.coding_assessment.language === 'python' ? '🐍 Python' : '🟨 JavaScript'}
                    </span>
                )}
                {assessment.coding_assessment?.test_cases && (
                    <span className="text-xs text-text-muted">
                        {Array.isArray(assessment.coding_assessment.test_cases)
                            ? assessment.coding_assessment.test_cases.length
                            : 0} test cases
                    </span>
                )}
                <span className={`flex items-center gap-1 text-xs ml-auto ${isOverdue ? 'text-error' : 'text-text-muted'}`}>
                    <ClockIcon />
                    {formatDateTime(assessment.due_date)}
                </span>
            </div>
        </div>
    );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
    <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-neutral-100 rounded-2xl" />
        ))}
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const CodingAssessmentsPage = () => {
    const { data: courses, isLoading } = useTeacherCourses();

    // Flatten all CODING assessments across all courses, with course context
    const codingAssessments = [];
    if (courses) {
        for (const course of courses) {
            for (const announcement of course.announcements || []) {
                for (const assessment of announcement.assessments || []) {
                    if (assessment.type === 'CODING') {
                        codingAssessments.push({ assessment, courseId: course.id, courseName: course.title });
                    }
                }
            }
        }
    }

    // Sort by most recently created
    codingAssessments.sort((a, b) => new Date(b.assessment.createdAt) - new Date(a.assessment.createdAt));

    return (
        <TeacherSidebar>
            <div className="max-w-4xl mx-auto p-6 pb-16">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CodeIcon />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary">Code Assessments</h1>
                    </div>
                    <p className="text-sm text-text-secondary">
                        All coding assessments across your courses. Click any card to view submissions and test results.
                    </p>
                </div>

                {isLoading && <Skeleton />}

                {!isLoading && codingAssessments.length === 0 && (
                    <div className="text-center py-20 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-500">
                            <CodeIcon />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">No coding assessments yet</h3>
                        <p className="text-sm text-text-secondary max-w-sm mx-auto">
                            Go to a course and create an assessment with type <strong>Coding</strong> to get started.
                        </p>
                    </div>
                )}

                {!isLoading && codingAssessments.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                            {codingAssessments.length} assessment{codingAssessments.length !== 1 ? 's' : ''} found
                        </p>
                        {codingAssessments.map(({ assessment, courseId, courseName }) => (
                            <CodingAssessmentCard
                                key={assessment.id}
                                assessment={assessment}
                                courseId={courseId}
                                courseName={courseName}
                            />
                        ))}
                    </div>
                )}
            </div>
        </TeacherSidebar>
    );
};

export default CodingAssessmentsPage;
