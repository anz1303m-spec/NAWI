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
    <div className="skeleton-card flex items-center gap-4 border border-[#DED7C8] rounded-[13px] p-5 bg-[#F4F0E8] shadow-[3px_3px_8px_#DBD3C3,-3px_-3px_8px_#FFFFFF]">
        <div className="skeleton-pulse rounded-[13px] w-12 h-12 flex-shrink-0" />
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
    <div className="bg-[#F4F0E8] rounded-[13px] border border-[#DED7C8] overflow-hidden shadow-[4px_4px_10px_#DBD3C3,-4px_-4px_10px_#FFFFFF]">
        <div className="p-5 border-b border-[#DED7C8] bg-[#EAE4D6] flex items-center justify-between">
            <SkeletonLine width="200px" height="20px" />
            <SkeletonLine width="100px" height="32px" borderRadius="13px" />
        </div>
        <div className="p-4 space-y-3">
            {/* Header row */}
            <div className="flex gap-4 pb-3 border-b border-[#DED7C8]">
                {Array.from({ length: cols }).map((_, idx) => (
                    <SkeletonLine key={idx} width={`${100 / cols}%`} height="14px" />
                ))}
            </div>
            {/* Body rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-4 py-2 border-b border-[#DED7C8]/40 last:border-0 items-center">
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
    <div className="bg-[#F4F0E8] rounded-[13px] border border-[#DED7C8] p-6 space-y-6 shadow-[4px_4px_10px_#DBD3C3,-4px_-4px_10px_#FFFFFF]">
        <div className="space-y-2">
            <SkeletonLine width="180px" height="22px" />
            <SkeletonLine width="280px" height="14px" />
        </div>
        <div className="space-y-4">
            <div className="space-y-2">
                <SkeletonLine width="100px" height="14px" />
                <SkeletonLine width="100%" height="40px" borderRadius="13px" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <SkeletonLine width="80px" height="14px" />
                    <SkeletonLine width="100%" height="40px" borderRadius="13px" />
                </div>
                <div className="space-y-2">
                    <SkeletonLine width="80px" height="14px" />
                    <SkeletonLine width="100%" height="40px" borderRadius="13px" />
                </div>
            </div>
            <div className="pt-2">
                <SkeletonLine width="140px" height="42px" borderRadius="13px" />
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DED7C8] pb-5">
            <div className="space-y-2">
                <SkeletonLine width="260px" height="28px" />
                <SkeletonLine width="380px" height="14px" />
            </div>
            <div className="flex gap-3">
                <SkeletonLine width="110px" height="38px" borderRadius="13px" />
                <SkeletonLine width="130px" height="38px" borderRadius="13px" />
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
        <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[13px] p-6 shadow-[4px_4px_10px_#DBD3C3,-4px_-4px_10px_#FFFFFF] space-y-4">
            <div className="flex justify-between items-center border-b border-[#DED7C8] pb-4">
                <SkeletonLine width="220px" height="26px" />
                <SkeletonLine width="90px" height="28px" borderRadius="13px" />
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
            <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[13px] p-6 space-y-4 shadow-[4px_4px_10px_#DBD3C3,-4px_-4px_10px_#FFFFFF]">
                <SkeletonLine width="160px" height="20px" />
                <SkeletonLine width="100%" height="120px" borderRadius="13px" />
                <div className="space-y-2">
                    <SkeletonLine width="100%" height="14px" />
                    <SkeletonLine width="80%" height="14px" />
                </div>
            </div>
            <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[13px] p-6 space-y-4 shadow-[4px_4px_10px_#DBD3C3,-4px_-4px_10px_#FFFFFF]">
                <SkeletonLine width="160px" height="20px" />
                <SkeletonLine width="100%" height="120px" borderRadius="13px" />
                <div className="space-y-2">
                    <SkeletonLine width="100%" height="14px" />
                    <SkeletonLine width="80%" height="14px" />
                </div>
            </div>
        </div>
    </div>
);

export default SkeletonDashboard;
