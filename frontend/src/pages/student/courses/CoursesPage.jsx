import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JoinCourseDialog from './JoinCourseDialog';
import { useEnrolledCourses, useUnenrollCourse } from '../../../hooks/useCourses';
import CourseActions from '../../../components/CourseActions';
import toast from 'react-hot-toast';

// Soft course card header backgrounds (teal-friendly palette)
const CARD_COLORS = [
    '#0f766e', // deep muted teal
    '#134e4a', // dark teal-green
    '#1e3a5f', // soft navy blue
    '#3f3cbb', // muted indigo
    '#6b7280', // cool gray
    '#374151', // slate gray
    '#7c3aed', // soft purple
    '#065f46', // forest teal
];

// Student avatar icon (generic person silhouette or image)
const AvatarIcon = ({ className = '', src, name }) => (
    <div className={`rounded-full overflow-hidden border-2 border-white/60 bg-neutral-200 flex items-center justify-center ${className}`}>
        {src && src.trim() !== "" ? (
            <img 
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profiles/${src}`} 
                alt={name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                }}
            />
        ) : null}
        <div className={`w-full h-full items-center justify-center ${src ? 'hidden' : 'flex'}`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-neutral-500">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
        </div>
    </div>
);

// ... existing code ...

const CourseCard = ({ course, onClick, onUnenroll }) => {
    return (
        <div
            onClick={onClick}
            className="bg-background rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden cursor-pointer"
        >
            {/* Colored Header — fixed height so it never grows */}
            <div
                className="relative h-28 flex-shrink-0"
                style={{ backgroundColor: course.color }}
            >
                {/* Three-dot menu */}
                <div className="absolute top-3 right-3 z-20">
                    <CourseActions
                        actions={[
                            {
                                label: 'Unenroll',
                                icon: (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                ),
                                onClick: () => {
                                    if (window.confirm(`Are you sure you want to unenroll from ${course.title}?`)) {
                                        onUnenroll(course.id);
                                    }
                                },
                                danger: true
                            }
                        ]}
                    />
                </div>

                {/* Course Title + Meta pinned to top-left */}
                <div className="absolute top-0 left-0 right-10 p-4">
                    <h3 className="text-white font-bold text-base leading-snug line-clamp-2">
                        {course.title}
                    </h3>
                    <div className="mt-1 space-y-0.5">
                        <p className="text-white/80 text-xs font-medium">
                            {course.code}
                        </p>
                        <p className="text-white/80 text-xs">
                            {course.teacher?.name ?? 'Unknown Instructor'}
                        </p>
                    </div>
                </div>

                {/* Avatar — overlapping the header bottom */}
                <div className="absolute -bottom-5 right-4">
                    <AvatarIcon 
                        className="w-10 h-10" 
                        src={course.teacher?.profile_picture} 
                        name={course.teacher?.name}
                    />
                </div>
            </div>

            {/* Card Body — spacer so avatar overlap is clear */}
            <div className="flex-1 pt-8" />


        </div>
    );
};

const CoursesPage = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();
    const { data: courses = [], isLoading } = useEnrolledCourses();
    const { mutate: unenroll } = useUnenrollCourse();

    const handleUnenroll = (courseId) => {
        unenroll(courseId, {
            onSuccess: () => toast.success('Unenrolled successfully'),
            onError: () => toast.error('Failed to unenroll')
        });
    };

    return (
        <div className="relative min-h-full">
            {/* Top-right Plus Button */}
            <button
                onClick={() => setIsDialogOpen(true)}
                title="Join a course"
                className="fixed top-6 right-8 z-40 bg-primary text-text-inverse w-12 h-12 rounded-full shadow-lg hover:shadow-xl hover:bg-primary-hover transition-all flex items-center justify-center"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary">My Courses</h1>
                <p className="text-sm text-text-secondary mt-1">
                    {isLoading
                        ? 'Loading your courses…'
                        : `You are enrolled in ${courses.length} course${courses.length !== 1 ? 's' : ''} this semester.`
                    }
                </p>
            </div>

            {/* Loading skeletons */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-background rounded-2xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden animate-pulse">
                            <div className="h-28 bg-neutral-200 flex-shrink-0" />
                            <div className="flex-1 pt-8" />
                            <div className="border-t border-neutral-100 px-4 py-3 h-12" />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && courses.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-accent-50 border border-accent-100 flex items-center justify-center mb-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-accent-400">
                            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-text-primary mb-1">No courses yet</h2>
                    <p className="text-sm text-text-secondary mb-4">
                        Join your first course using the code provided by your instructor.
                    </p>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors"
                    >
                        Join a Course
                    </button>
                </div>
            )}

            {/* Course Cards Grid */}
            {!isLoading && courses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map((course, index) => (
                        <CourseCard
                            key={course.id}
                            course={{ ...course, color: CARD_COLORS[index % CARD_COLORS.length] }}
                            onClick={() => navigate(`/student/courses/${course.id}`)}
                            onUnenroll={handleUnenroll}
                        />
                    ))}
                </div>
            )}

            {/* Join Course Dialog */}
            <JoinCourseDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </div>
    );
};

export default CoursesPage;
