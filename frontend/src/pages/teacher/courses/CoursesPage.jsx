import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacherCourses, useDeleteCourse } from '../../../hooks/useCourses';
import CreateCourseDialog from './CreateCourseDialog';
import CourseActions from '../../../components/CourseActions';
import toast from 'react-hot-toast';

// Soft course card header backgrounds (same palette as student side)
const CARD_COLORS = [
    '#0f766e', '#134e4a', '#1e3a5f', '#3f3cbb',
    '#6b7280', '#374151', '#7c3aed', '#065f46',
];

const MoreVertIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
);

const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const TeacherCourseCard = ({ course, onClick, onDelete }) => {
    const studentCount = course.students?.length ?? 0;

    return (
        <div
            onClick={onClick}
            className="bg-background rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden cursor-pointer"
        >
            {/* Colored Header */}
            <div className="relative h-28 flex-shrink-0" style={{ backgroundColor: course.color }}>
                <div className="absolute top-3 right-3 z-20">
                    <CourseActions 
                        actions={[
                            {
                                label: 'Delete Course',
                                icon: (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                ),
                                onClick: () => {
                                    if (window.confirm(`Are you sure you want to delete ${course.title}? This will permanently remove all assessments, attendance, and student data for this course.`)) {
                                        onDelete(course.id);
                                    }
                                },
                                danger: true
                            }
                        ]}
                    />
                </div>

                <div className="absolute top-0 left-0 right-10 p-4">
                    <h3 className="text-white font-bold text-base leading-snug line-clamp-2">
                        {course.title}
                    </h3>
                    <div className="mt-1">
                        <p className="text-white/80 text-xs font-medium">{course.code}</p>
                    </div>
                </div>

                {/* Student count badge */}
                <div className="absolute bottom-3 right-4 flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
                    <UsersIcon />
                    <span className="text-white text-xs font-semibold">{studentCount}</span>
                </div>
            </div>

            {/* Card Body */}
            <div className="flex-1 px-4 pt-4 pb-3">
                {course.description ? (
                    <p className="text-xs text-text-secondary line-clamp-2">{course.description}</p>
                ) : (
                    <p className="text-xs text-text-muted italic">No description</p>
                )}
            </div>

            {/* Card Footer */}
            <div className="border-t border-neutral-100 px-4 py-3 flex items-center gap-2 text-xs text-text-muted">
                <UsersIcon />
                <span>{studentCount} student{studentCount !== 1 ? 's' : ''} enrolled</span>
                <span className="ml-auto font-mono text-accent-500 font-semibold">{course.code}</span>
            </div>
        </div>
    );
};

const TeacherCoursesPage = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();
    const { data: courses = [], isLoading } = useTeacherCourses();
    const { mutate: deleteCourse } = useDeleteCourse();

    const handleDelete = (courseId) => {
        deleteCourse(courseId, {
            onSuccess: () => toast.success('Course deleted successfully'),
            onError: () => toast.error('Failed to delete course')
        });
    };

    return (
        <div className="relative min-h-full">
            {/* Top-right Create Button */}
            <button
                onClick={() => setIsDialogOpen(true)}
                title="Create a course"
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
                        : `You are teaching ${courses.length} course${courses.length !== 1 ? 's' : ''}.`
                    }
                </p>
            </div>

            {/* Loading skeletons */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-background rounded-2xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden animate-pulse">
                            <div className="h-28 bg-neutral-200 flex-shrink-0" />
                            <div className="flex-1 p-4 space-y-2">
                                <div className="h-3 bg-neutral-200 rounded w-3/4" />
                                <div className="h-3 bg-neutral-200 rounded w-1/2" />
                            </div>
                            <div className="border-t border-neutral-100 px-4 py-3 h-10" />
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
                        Create your first course and share the code with your students.
                    </p>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-hover transition-colors"
                    >
                        Create a Course
                    </button>
                </div>
            )}

            {/* Course Cards Grid */}
            {!isLoading && courses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map((course, index) => (
                        <TeacherCourseCard
                            key={course.id}
                            course={{ ...course, color: CARD_COLORS[index % CARD_COLORS.length] }}
                            onClick={() => navigate(`/teacher/courses/${course.id}`)}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Create Course Dialog */}
            <CreateCourseDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </div>
    );
};

export default TeacherCoursesPage;
