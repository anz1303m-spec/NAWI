import React from 'react';

/**
 * Basic Skeleton Line / Block (Soft UI Warm Beige)
 */
export const SkeletonLine = ({ width = '100%', height = '16px', borderRadius = '13px', className = '' }) => (
    <div
        className={`skeleton-pulse ${className}`}
        style={{ width, height, borderRadius }}
    />
);

/**
 * Skeleton Stat Card
 */
export const SkeletonStatCard = () => (
    <div className="skeleton-card flex items-center gap-4 border border-[#E2E8F0] rounded-[14px] p-5 bg-white shadow-sm">
        <div className="skeleton-pulse rounded-[12px] w-12 h-12 flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <SkeletonLine width="40%" height="12px" />
            <SkeletonLine width="75%" height="24px" />
        </div>
    </div>
);

/**
 * Skeleton Table Loader
 */
export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <SkeletonLine width="200px" height="20px" />
            <SkeletonLine width="100px" height="32px" borderRadius="10px" />
        </div>
        <div className="p-4 space-y-3">
            {/* Header row */}
            <div className="flex gap-4 pb-3 border-b border-[#E2E8F0]">
                {Array.from({ length: cols }).map((_, idx) => (
                    <SkeletonLine key={idx} width={`${100 / cols}%`} height="14px" />
                ))}
            </div>
            {/* Body rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-4 py-2 border-b border-[#E2E8F0]/40 last:border-0 items-center">
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <SkeletonLine
                            key={colIdx}
                            width={colIdx === 0 ? '70%' : `${80 / cols}%`}
                            height="16px"
                        />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

/**
 * Skeleton Form Loader
 */
export const SkeletonForm = () => (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-6 space-y-6 shadow-sm">
        <div className="space-y-2">
            <SkeletonLine width="180px" height="22px" />
            <SkeletonLine width="280px" height="14px" />
        </div>
        <div className="space-y-4">
            <div className="space-y-2">
                <SkeletonLine width="100px" height="14px" />
                <SkeletonLine width="100%" height="40px" borderRadius="10px" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <SkeletonLine width="80px" height="14px" />
                    <SkeletonLine width="100%" height="40px" borderRadius="10px" />
                </div>
                <div className="space-y-2">
                    <SkeletonLine width="80px" height="14px" />
                    <SkeletonLine width="100%" height="40px" borderRadius="10px" />
                </div>
            </div>
            <div className="pt-2">
                <SkeletonLine width="140px" height="42px" borderRadius="10px" />
            </div>
        </div>
    </div>
);

/**
 * Skeleton Full Dashboard Page Layout
 */
export const SkeletonDashboard = () => (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-5">
            <div className="space-y-2">
                <SkeletonLine width="260px" height="28px" />
                <SkeletonLine width="380px" height="14px" />
            </div>
            <div className="flex gap-3">
                <SkeletonLine width="110px" height="38px" borderRadius="10px" />
                <SkeletonLine width="130px" height="38px" borderRadius="10px" />
            </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <SkeletonTable rows={4} cols={4} />
            </div>
            <div className="space-y-6">
                <SkeletonForm />
            </div>
        </div>
    </div>
);

/**
 * Skeleton Report / Test Execution Page
 */
export const SkeletonReportPage = () => (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-4">
                <SkeletonLine width="220px" height="26px" />
                <SkeletonLine width="90px" height="28px" borderRadius="10px" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="space-y-2">
                        <SkeletonLine width="60%" height="12px" />
                        <SkeletonLine width="90%" height="18px" />
                    </div>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-6 space-y-4 shadow-sm">
                <SkeletonLine width="160px" height="20px" />
                <SkeletonLine width="100%" height="120px" borderRadius="10px" />
                <div className="space-y-2">
                    <SkeletonLine width="100%" height="14px" />
                    <SkeletonLine width="80%" height="14px" />
                </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-6 space-y-4 shadow-sm">
                <SkeletonLine width="160px" height="20px" />
                <SkeletonLine width="100%" height="120px" borderRadius="10px" />
                <div className="space-y-2">
                    <SkeletonLine width="100%" height="14px" />
                    <SkeletonLine width="80%" height="14px" />
                </div>
            </div>
        </div>
    </div>
);

export default SkeletonDashboard;
