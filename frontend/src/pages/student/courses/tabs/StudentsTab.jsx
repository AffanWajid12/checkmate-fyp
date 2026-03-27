import { useState } from 'react';
import { getAvatarUrl } from '../../../../utils/avatarHelper';

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-text-muted">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const StudentsTab = ({ course }) => {
    const [search, setSearch] = useState('');
    const students = course?.students?.map((e) => e.student) ?? [];
    const q = search.toLowerCase();
    const filtered = students.filter(
        (s) => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <SearchIcon />
                </span>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search classmates…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all"
                />
            </div>

            {/* Student count */}
            <p className="text-xs text-text-muted font-medium">
                {filtered.length} classmate{filtered.length !== 1 ? 's' : ''}
                {search && ` matching "${search}"`}
            </p>

            {/* Student list */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <p className="text-sm font-semibold text-text-primary mb-1">
                            {students.length === 0 ? 'No classmates found' : 'No matches found'}
                        </p>
                        <p className="text-xs text-text-secondary">
                            {students.length === 0
                                ? 'It seems you are the only one here!'
                                : 'Try a different search term.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {filtered.map((student, idx) => (
                            <div
                                key={student.id}
                                className={`flex items-center gap-4 px-5 py-4 ${idx % 2 === 1 ? 'bg-neutral-50/40' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-neutral-200">
                                    {student.profile_picture ? (
                                        <img 
                                            src={getAvatarUrl(student.profile_picture)} 
                                            alt={student.name} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <span className={`text-sm font-bold text-accent-600 ${student.profile_picture ? 'hidden' : 'flex'}`}>
                                        {student.name?.charAt(0).toUpperCase() ?? '?'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-text-primary truncate">{student.name}</p>
                                    <p className="text-xs text-text-muted truncate">{student.email}</p>
                                </div>
                                <span className="text-xs font-medium text-text-muted bg-neutral-100 px-2.5 py-1 rounded-full">
                                    Classmate
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentsTab;
