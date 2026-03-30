export const AnnouncementSkeleton = () => (
    <div className="mt10 bg-background rounded-2xl border border-neutral-200 shadow-sm p-5 animate-pulse">
        <div className="flex items-start justify-between gap-4 mb-3">
            <div className="h-4 bg-neutral-200 rounded w-2/3" />
            <div className="h-3 bg-neutral-200 rounded w-16" />
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-neutral-200 rounded w-full" />
            <div className="h-3 bg-neutral-200 rounded w-4/5" />
        </div>
    </div>
);
