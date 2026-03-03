import { useNavigate } from 'react-router-dom';
import { useTeacherCourses, useCourseAttendance } from '../../../hooks/useCourses';

// ─── Per-course attendance summary card ───────────────────────

const CourseAttendanceCard = ({ course }) => {
    const navigate = useNavigate();
    const { data: records = [], isLoading } = useCourseAttendance(course.id);

    const total = records.length;
    const studentCount = course.students?.length ?? 0;

    // Count unique session dates
    const sessions = [...new Set(records.map((r) => r.date?.slice(0, 10)))].length;

    // Overall present rate across all records
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : null;

    const rateColor =
        rate === null ? 'text-text-muted' :
        rate >= 75    ? 'text-success'    : 'text-red-500';

    const barColor = rate !== null && rate < 75 ? 'bg-red-400' : 'bg-success';

    return (
        <div
            onClick={() => navigate(`/teacher/courses/${course.id}/attendance`)}
            className="bg-background rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 flex flex-col gap-3"
        >
            {/* Course info */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-text-primary leading-snug truncate">
                        {course.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                        {course.code} · {studentCount} student{studentCount !== 1 ? 's' : ''}
                    </p>
                </div>
                <span className={`text-lg font-bold flex-shrink-0 ${rateColor}`}>
                    {isLoading ? '—' : rate !== null ? `${rate}%` : 'N/A'}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                {!isLoading && rate !== null && (
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${rate}%` }}
                    />
                )}
                {isLoading && <div className="h-full w-1/2 bg-neutral-200 rounded-full animate-pulse" />}
            </div>

            {/* Counts row */}
            <div className="flex items-center gap-3 text-xs text-text-muted">
                {isLoading ? (
                    <span className="animate-pulse">Loading…</span>
                ) : (
                    <>
                        <span className="text-success font-medium">{present} present</span>
                        <span>·</span>
                        <span className="text-red-400 font-medium">
                            {records.filter((r) => r.status === 'ABSENT').length} absent
                        </span>
                        <span>·</span>
                        <span className="text-amber-500 font-medium">
                            {records.filter((r) => r.status === 'LATE').length} late
                        </span>
                        <span className="ml-auto">{sessions} session{sessions !== 1 ? 's' : ''}</span>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Skeleton ─────────────────────────────────────────────────

const CardSkeleton = () => (
    <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm p-5 animate-pulse flex flex-col gap-3">
        <div className="flex justify-between">
            <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
            </div>
            <div className="h-6 w-12 bg-neutral-200 rounded" />
        </div>
        <div className="h-2 bg-neutral-200 rounded-full" />
        <div className="flex gap-3">
            <div className="h-3 bg-neutral-200 rounded w-16" />
            <div className="h-3 bg-neutral-200 rounded w-14" />
            <div className="h-3 bg-neutral-200 rounded w-12" />
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────

const TeacherAttendanceOverview = () => {
    const { data: courses = [], isLoading } = useTeacherCourses();

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary">Attendance</h1>
                <p className="text-sm text-text-secondary mt-1">
                    {isLoading
                        ? 'Loading your courses…'
                        : `Showing attendance overview for ${courses.length} course${courses.length !== 1 ? 's' : ''}.`}
                </p>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && courses.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 border border-accent-100 flex items-center justify-center mb-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-accent-400">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <path d="M9 16l2 2 4-4" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-text-primary mb-1">No courses yet</h2>
                    <p className="text-sm text-text-secondary">
                        Create a course to start tracking attendance.
                    </p>
                </div>
            )}

            {/* Cards */}
            {!isLoading && courses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => (
                        <CourseAttendanceCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherAttendanceOverview;
