import { useState, useMemo } from 'react';
import { useStudentMarks } from '../../../hooks/useCourses';
import { 
    TrophyIcon, 
    AcademicCapIcon, 
    ChartBarIcon, 
    ChevronDownIcon,
    ArrowTrendingUpIcon,
    InboxIcon
} from '../../teacher/courses/CoursePage/components/Icons';

// ─── Stats Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-2xl font-black text-text-primary">{value}</p>
        </div>
    </div>
);

// ─── Assessment Row ────────────────────────────────────────────────────────────

const AssessmentRow = ({ result }) => {
    const percentage = result.totalMarks > 0 ? (result.obtainedMarks / result.totalMarks) * 100 : 0;
    const scoreColor = percentage >= 80 ? 'text-success' : percentage >= 60 ? 'text-accent-500' : 'text-error';
    
    return (
        <div className="group grid grid-cols-1 md:grid-cols-8 gap-4 px-6 py-4 items-center hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0">
            <div className="md:col-span-2">
                <p className="text-sm font-bold text-text-primary group-hover:text-accent-500 transition-colors">
                    {result.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted bg-neutral-100 px-1.5 py-0.5 rounded">
                        {result.type}
                    </span>
                </div>
            </div>
            
            <div className="md:col-span-1 text-center md:text-left">
                <p className="text-xs text-text-muted mb-0.5 font-bold uppercase">Obtained</p>
                <p className={`text-sm font-black ${scoreColor}`}>
                    {result.obtainedMarks}
                </p>
            </div>
            
            <div className="md:col-span-1 text-center md:text-left">
                <p className="text-xs text-text-muted mb-0.5 font-bold uppercase">Total</p>
                <p className="text-sm font-bold text-text-primary">{result.totalMarks}</p>
            </div>

            <div className="md:col-span-1 text-center">
                <p className="text-xs text-text-muted mb-0.5 font-bold uppercase">Avg</p>
                <p className="text-sm font-semibold text-text-secondary">{result.stats.average || '—'}</p>
            </div>

            <div className="md:col-span-1 text-center">
                <p className="text-xs text-text-muted mb-0.5 font-bold uppercase">Range</p>
                <p className="text-xs font-medium text-text-muted">
                    {result.stats.min} – {result.stats.max}
                </p>
            </div>

            <div className="md:col-span-1 text-center">
                <p className="text-xs text-text-muted mb-0.5 font-bold uppercase">Std Dev</p>
                <p className="text-sm font-semibold text-text-secondary">{result.stats.stdDev || '—'}</p>
            </div>

            <div className="md:col-span-1 flex flex-col items-end">
                <div className="w-full max-w-[80px] h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${percentage >= 80 ? 'bg-success' : percentage >= 60 ? 'bg-accent-500' : 'bg-error'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className="text-[10px] font-bold text-text-muted mt-1">{Math.round(percentage)}%</span>
            </div>
        </div>
    );
};

// ─── Group Section ─────────────────────────────────────────────────────────────

const GroupSection = ({ title, results }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-white border-b border-neutral-100 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-neutral-50/30 px-6 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
            >
                <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">
                    {title} ({results.length})
                </span>
                <div className={`text-text-muted transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}>
                    <ChevronDownIcon size={16} />
                </div>
            </button>
            
            {isOpen && (
                <div className="divide-y divide-neutral-100">
                    {results.map(res => (
                        <AssessmentRow key={res.id} result={res} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const MarksPage = () => {
    const { data: marksData, isLoading, isError } = useStudentMarks();
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    const selectedCourse = useMemo(() => {
        if (!marksData) return null;
        if (selectedCourseId) return marksData.find(m => m.courseId === selectedCourseId);
        return marksData[0];
    }, [marksData, selectedCourseId]);

    const groupedResults = useMemo(() => {
        if (!selectedCourse) return {};
        const labels = {
            'ASSIGNMENT': 'Assignments',
            'QUIZ': 'Quizzes',
            'EXAM': 'Exams'
        };
        
        return selectedCourse.results.reduce((acc, res) => {
            const label = labels[res.type] || res.type;
            if (!acc[label]) acc[label] = [];
            acc[label].push(res);
            return acc;
        }, {});
    }, [selectedCourse]);

    if (isLoading) return (
        <div className="space-y-8 animate-pulse">
            <div className="h-10 bg-neutral-200 rounded-xl w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-neutral-100 rounded-2xl" />)}
            </div>
            <div className="h-96 bg-neutral-100 rounded-3xl" />
        </div>
    );

    if (isError) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-4">
                <InboxIcon size={32} />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Failed to load marks</h3>
            <p className="text-text-secondary">Please try again later or contact support.</p>
        </div>
    );

    if (!marksData || marksData.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 text-text-muted flex items-center justify-center mb-4">
                <AcademicCapIcon size={32} />
            </div>
            <h3 className="text-xl font-bold text-text-primary">No marks yet</h3>
            <p className="text-text-secondary">Enroll in courses and complete assessments to see your performance here.</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header with Course Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-text-primary tracking-tight">Academic Performance</h1>
                    <p className="text-sm text-text-muted font-medium">Track your marks and class standing</p>
                </div>

                <div className="relative inline-block min-w-[280px]">
                    <select
                        value={selectedCourse?.courseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full appearance-none bg-neutral-50 border border-neutral-200 text-text-primary text-sm font-bold rounded-2xl px-5 py-3 pr-12 focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 outline-none transition-all cursor-pointer"
                    >
                        {marksData.map(c => (
                            <option key={c.courseId} value={c.courseId}>
                                {c.courseCode}: {c.courseTitle}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                        <ChevronDownIcon size={18} />
                    </div>
                </div>
            </div>

            {selectedCourse && (
                <>
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            label="Course Grade" 
                            value={`${selectedCourse.grandObtained} / ${selectedCourse.grandTotal}`}
                            icon={<TrophyIcon className="text-amber-500" />}
                            color="bg-amber-50 border border-amber-100"
                        />
                        <StatCard 
                            label="Percentage" 
                            value={`${selectedCourse.grandTotal > 0 ? Math.round((selectedCourse.grandObtained / selectedCourse.grandTotal) * 100) : 0}%`}
                            icon={<ArrowTrendingUpIcon className="text-accent-500" />}
                            color="bg-accent-50 border border-accent-100"
                        />
                        <StatCard 
                            label="Assessments" 
                            value={selectedCourse.results.length}
                            icon={<ChartBarIcon className="text-primary-500" />}
                            color="bg-primary-50 border border-primary-100"
                        />
                    </div>

                    {/* Results Table */}
                    <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                        <div className="bg-neutral-50/50 px-6 py-4 border-b border-neutral-100">
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Detailed Breakdown</h3>
                        </div>
                        
                        <div className="divide-y divide-neutral-100">
                            {selectedCourse.results.length > 0 ? (
                                Object.entries(groupedResults).map(([type, results]) => (
                                    <GroupSection key={type} title={type} results={results} />
                                ))
                            ) : (
                                <div className="py-20 text-center">
                                    <p className="text-sm text-text-muted italic">No graded assessments for this course yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer / Grand Total */}
                        {selectedCourse.results.length > 0 && (
                            <div className="bg-neutral-900 text-white p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Graded Performance</p>
                                    <p className="text-lg font-bold">Accumulated Marks ({selectedCourse.gradedCount} graded)</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black">{selectedCourse.grandObtained} / {selectedCourse.grandTotal}</p>
                                    <p className="text-xs font-bold text-white/70">
                                        Weighted Percentage: {Math.round((selectedCourse.grandObtained / selectedCourse.grandTotal) * 100)}%
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default MarksPage;
