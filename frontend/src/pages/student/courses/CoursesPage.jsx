import { useState } from 'react';
import JoinCourseDialog from './JoinCourseDialog';

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

const mockCourses = [
    {
        id: 1,
        title: 'Programming Fundamentals',
        code: 'CS101',
        section: 'Section A',
        instructor: 'Dr. Ahmed Saeed',
        color: CARD_COLORS[0],
    },
    {
        id: 2,
        title: 'Introduction to Psychology',
        code: 'PSY101',
        section: 'Section B',
        instructor: 'Dr. Ahmed Saeed',
        color: CARD_COLORS[1],
    },
    {
        id: 3,
        title: 'Calculus II',
        code: 'MAT201',
        section: 'Section A',
        instructor: 'Dr. Ahmed Saeed',
        color: CARD_COLORS[2],
    },
    {
        id: 4,
        title: 'Art History & Theory',
        code: 'ART220',
        section: 'Section C',
        instructor: 'Dr. Ahmed Saeed',
        color: CARD_COLORS[3],
    },
];

// Student avatar icon (generic person silhouette)
const AvatarIcon = ({ className = '' }) => (
    <div className={`rounded-full overflow-hidden border-2 border-white/60 bg-neutral-200 flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-neutral-500">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
    </div>
);

// Three-dot menu icon
const MoreVertIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
);

// Roster icon
const RosterIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);

// Folder icon
const FolderIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
);

const CourseCard = ({ course }) => {
    return (
        <div className="bg-background rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
            {/* Colored Header — fixed height so it never grows */}
            <div
                className="relative h-28 flex-shrink-0"
                style={{ backgroundColor: course.color }}
            >
                {/* Three-dot menu */}
                <button className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors z-10">
                    <MoreVertIcon />
                </button>

                {/* Course Title + Meta pinned to top-left */}
                <div className="absolute top-0 left-0 right-10 p-4">
                    <h3 className="text-white font-bold text-base leading-snug line-clamp-2">
                        {course.title}
                    </h3>
                    <div className="mt-1 space-y-0.5">
                        <p className="text-white/80 text-xs font-medium">
                            {course.code} &bull; {course.section}
                        </p>
                        <p className="text-white/80 text-xs">
                            {course.instructor}
                        </p>
                    </div>
                </div>

                {/* Avatar — overlapping the header bottom */}
                <div className="absolute -bottom-5 right-4">
                    <AvatarIcon className="w-10 h-10" />
                </div>
            </div>

            {/* Card Body — spacer so avatar overlap is clear */}
            <div className="flex-1 pt-8" />

            {/* Card Footer */}
            <div className="border-t border-neutral-100 px-4 py-3 flex items-center gap-3 text-text-muted">
                <button className="hover:text-accent-500 transition-colors" title="Roster">
                    <RosterIcon />
                </button>
                <button className="hover:text-accent-500 transition-colors" title="Course Files">
                    <FolderIcon />
                </button>
            </div>
        </div>
    );
};

const CoursesPage = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
                    You are enrolled in {mockCourses.length} course{mockCourses.length !== 1 ? 's' : ''} this semester.
                </p>
            </div>

            {/* Course Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>

            {/* Join Course Dialog */}
            <JoinCourseDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </div>
    );
};

export default CoursesPage;
