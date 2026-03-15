import Skeleton from '@/components/ui/Skeleton';

/* ─── Stat card skeleton ─────────────────────────────────────── */
function StatCardSkeleton({ delay }: { delay: number }) {
    return (
        <div
            className="relative overflow-hidden rounded-[2.5rem] p-8 bg-white border border-slate-200/60 shadow-sm"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* icon + badge row */}
            <div className="flex items-center justify-between">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <Skeleton className="w-16 h-6 rounded-full" />
            </div>
            {/* label + value */}
            <div className="mt-8 space-y-2.5">
                <Skeleton className="w-24 h-3 rounded-full" />
                <Skeleton className="w-16 h-8 rounded-xl" />
            </div>
            {/* decorative circle */}
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-slate-100 rounded-full" />
        </div>
    );
}

/* ─── Activity row skeleton ──────────────────────────────────── */
function ActivityRowSkeleton({ delay }: { delay: number }) {
    return (
        <div
            className="flex items-center justify-between p-6 rounded-[2rem]"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center gap-6">
                <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
                <div className="space-y-2.5">
                    <Skeleton className="w-56 h-3.5 rounded-full" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-28 h-2.5 rounded-full" />
                        <Skeleton className="w-1 h-1 rounded-full" />
                        <Skeleton className="w-16 h-2.5 rounded-full" />
                    </div>
                </div>
            </div>
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        </div>
    );
}

export default function DashboardLoading() {
    return (
        <div className="space-y-8 pb-10">
            {/* ── Top progress bar ───────────────────────────────── */}
            <div className="loading-bar" />

            {/* ── Page header ─────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div className="space-y-3">
                    <Skeleton className="w-64 h-8 rounded-2xl" />
                    <Skeleton className="w-80 h-3.5 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="w-24 h-10 rounded-xl" />
                    <Skeleton className="w-32 h-10 rounded-xl" />
                </div>
            </div>

            {/* ── Stats grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 px-2">
                <StatCardSkeleton delay={0} />
                <StatCardSkeleton delay={80} />
                <StatCardSkeleton delay={160} />
                <StatCardSkeleton delay={240} />
            </div>

            {/* ── Bottom row ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 px-2">

                {/* Activity feed — 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <Skeleton className="w-40 h-6 rounded-xl" />
                        <Skeleton className="w-16 h-4 rounded-full" />
                    </div>
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 shadow-2xl shadow-slate-200/40 p-2">
                        <ActivityRowSkeleton delay={0} />
                        <ActivityRowSkeleton delay={60} />
                        <ActivityRowSkeleton delay={120} />
                        <ActivityRowSkeleton delay={180} />
                        <ActivityRowSkeleton delay={240} />
                    </div>
                </div>

                {/* Quick actions — 1/3 */}
                <div className="space-y-6">
                    <Skeleton className="w-36 h-6 rounded-xl ml-4" />
                    <div className="space-y-5">
                        {/* Dark "Create Content" button */}
                        <div className="overflow-hidden rounded-[2.5rem] bg-slate-900/8 border border-slate-200/60 p-7">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-2xl" />
                                    <Skeleton className="w-32 h-4 rounded-full" />
                                </div>
                                <Skeleton className="w-5 h-5 rounded-full" />
                            </div>
                        </div>

                        {/* Media Library button */}
                        <div className="overflow-hidden rounded-[2.5rem] bg-white/80 border border-slate-200/60 shadow-sm p-7">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-2xl" />
                                    <Skeleton className="w-28 h-4 rounded-full" />
                                </div>
                                <Skeleton className="w-5 h-5 rounded-full" />
                            </div>
                        </div>

                        {/* Security card */}
                        <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-100/60 to-indigo-100/60 border border-blue-200/40 p-9 space-y-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-2xl" style={{ backgroundColor: '#bfdbfe' }} />
                                <Skeleton className="w-24 h-5 rounded-full" style={{ backgroundColor: '#bfdbfe' }} />
                            </div>
                            <Skeleton className="w-full h-3.5 rounded-full" style={{ backgroundColor: '#bfdbfe' }} />
                            <Skeleton className="w-4/5 h-3.5 rounded-full" style={{ backgroundColor: '#bfdbfe' }} />
                            <Skeleton className="w-full h-12 rounded-2xl mt-6" style={{ backgroundColor: '#bfdbfe' }} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
