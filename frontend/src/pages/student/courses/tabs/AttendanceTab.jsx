import { useStudentAttendance } from '../../../../hooks/useCourses';

const STATUS = {
    PRESENT: { label: 'Present', pill: 'bg-success-light text-success border-green-200' },
    ABSENT: { label: 'Absent', pill: 'bg-red-50 text-red-500 border-red-200' },
    LATE: { label: 'Late', pill: 'bg-amber-50 text-amber-600 border-amber-200' },
};

const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });

const RowSkeleton = () => (
    <div className="flex items-center justify-between px-5 py-3.5 animate-pulse">
        <div className="h-3.5 bg-neutral-200 rounded w-44" />
        <div className="h-6 bg-neutral-200 rounded-full w-20" />
    </div>
);

const AttendanceTab = ({ courseId }) => {
    const { data: records = [], isLoading } = useStudentAttendance(courseId);

    const summary = records.reduce(
        (acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        },
        { PRESENT: 0, ABSENT: 0, LATE: 0 }
    );
    const total = records.length;
    const attendanceRate = total > 0 ? Math.round((summary.PRESENT / total) * 100) : null;

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            {!isLoading && total > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total', value: total, color: 'text-text-primary', bg: 'bg-neutral-50 border-neutral-200' },
                        { label: 'Present', value: summary.PRESENT, color: 'text-success', bg: 'bg-success-light border-green-200' },
                        { label: 'Absent', value: summary.ABSENT, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
                        { label: 'Late', value: summary.LATE, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} className={`rounded-2xl border px-4 py-3 ${bg}`}>
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-text-muted mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Attendance rate bar */}
            {!isLoading && attendanceRate !== null && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-text-primary">Attendance Rate</span>
                        <span className={`text-sm font-bold ${attendanceRate >= 75 ? 'text-success' : 'text-red-500'}`}>
                            {attendanceRate}%
                        </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${attendanceRate >= 75 ? 'bg-success' : 'bg-red-400'
                                }`}
                            style={{ width: `${attendanceRate}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Records list */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-text-primary">Session Records</h2>
                    {!isLoading && (
                        <span className="text-xs text-text-muted">{total} session{total !== 1 ? 's' : ''}</span>
                    )}
                </div>

                {isLoading && (
                    <div className="divide-y divide-neutral-100">
                        {[...Array(5)].map((_, i) => <RowSkeleton key={i} />)}
                    </div>
                )}

                {!isLoading && records.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <p className="text-sm font-semibold text-text-primary mb-1">No records yet</p>
                        <p className="text-xs text-text-secondary">Attendance hasn't been marked yet.</p>
                    </div>
                )}

                {!isLoading && records.length > 0 && (
                    <div className="divide-y divide-neutral-100">
                        {records.map((record) => {
                            const cfg = STATUS[record.status] ?? STATUS.ABSENT;
                            return (
                                <div
                                    key={record.id}
                                    className="flex items-center justify-between px-5 py-3.5"
                                >
                                    <div>
                                        <p className="text-sm text-text-primary font-bold">
                                            {record.session?.title || 'Untitled Session'}
                                        </p>
                                        <p className="text-[11px] text-text-muted font-medium mt-0.5 uppercase tracking-wider">
                                            {formatDate(record.session?.date)}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.pill}`}
                                    >
                                        {cfg.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceTab;
