import TeacherCoursesPage from './courses/CoursesPage';
import TeacherSidebar from './TeacherSidebar';

// ── Main TeacherDashboard component ───────────────────────────
const TeacherDashboard = () => {
    return (
        <TeacherSidebar>
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <TeacherCoursesPage />
            </div>
        </TeacherSidebar>
    );
};

export default TeacherDashboard;
