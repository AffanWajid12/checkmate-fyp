// ─── Main Component ───────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import supabase from '../../../../utils/supabaseClient';
import logo from '../../../../logo.png';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCourseAnnouncements, useTeacherCourses } from '../../../../hooks/useCourses';

import { BackIcon, CopyIcon, UsersIcon, MegaphoneIcon } from './components/Icons';
import { AnnouncementCard } from './components/AnnouncementCard';
import { AnnouncementSkeleton } from './components/AnnouncementSkeleton';
import { PostAnnouncementForm } from './components/PostAnnouncementForm';
import { FABMenu } from './components/FABMenu';
import TeacherSidebar from '../../TeacherSidebar';

const TeacherCoursePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);

    const { data: courses = [] } = useTeacherCourses();
    const course = courses.find((c) => c.id === courseId);
    const studentCount = course?.students?.length ?? 0;

    const { data: announcements = [], isLoading } = useCourseAnnouncements(courseId);

    const handleCopyCode = () => {
        if (!course?.code) return;
        navigator.clipboard.writeText(course.code).then(() => toast.success('Code copied!'));
    };

    const handleAddAssessment = (announcementId) => {
        navigate(`/teacher/courses/${courseId}/add-assessment?announcementId=${announcementId}`);
    };

    return (
        <TeacherSidebar>
            <div className="max-w-3xl mx-auto pb-28 p-6">

                {/* Back + Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
                    >
                        <BackIcon />
                        Back to Courses
                    </button>

                    <div className="flex flex-col bg-white gap-4 w-full p-12 shadow-md border-zinc-400 rounded-lg">
                        <h1 className="text-2xl font-bold text-text-primary">
                            {course?.title ?? 'Course'}
                        </h1>
                        {course && (
                            <div className="flex items-center justify-between mt-1 flex-wrap">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleCopyCode}
                                        className="flex items-center gap-1.5 font-mono text-sm font-semibold text-accent-500 bg-accent-50 border border-accent-100 px-2.5 py-0.5 rounded-full hover:bg-accent-100 transition-colors"
                                    >
                                        Class Code
                                        <span className="ml-1">:</span>
                                        {course.code}
                                        <CopyIcon />
                                    </button>
                                </div>
                                <span className="flex items-center gap-1 text-sm text-text-secondary">
                                    <UsersIcon />
                                    {studentCount} student{studentCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Inline Announcement Form */}
                {showForm && (
                    <PostAnnouncementForm courseId={courseId} onCancel={() => setShowForm(false)} />
                )}

                {/* Announcements stream header */}
                <div className="mb-4 flex items-center gap-2">
                    <MegaphoneIcon />
                    <h2 className="text-base font-bold text-text-primary">Announcements</h2>
                    {!isLoading && (
                        <span className="ml-auto text-xs text-text-muted">
                            {announcements.length} post{announcements.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {isLoading && (
                    <div className="space-y-4">
                        {[...Array(2)].map((_, i) => <AnnouncementSkeleton key={i} />)}
                    </div>
                )}

                {!isLoading && announcements.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[20vh] text-center px-6">
                        <p className="text-sm text-text-secondary">
                            No announcements yet. Use the <strong className="text-text-primary">+</strong> button below to get started.
                        </p>
                    </div>
                )}

                {!isLoading && announcements.length > 0 && (
                    <div className="space-y-4">
                        {announcements.map((a) => (
                            <AnnouncementCard
                                key={a.id}
                                announcement={a}
                                courseId={courseId}
                                onAddAssessment={handleAddAssessment}
                            />
                        ))}
                    </div>
                )}

                {/* Floating Action Button */}
                <FABMenu courseId={courseId} onAddAnnouncement={() => setShowForm(true)} />
            </div>
        </TeacherSidebar>
    );
};

export default TeacherCoursePage;
