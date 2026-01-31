import React from 'react';
import { ToothState, SurfaceState } from '@/types/odontogram';
import { cn } from '@/lib/utils';

interface ToothProps {
    data: ToothState;
    onSurfaceClick: (toothId: number, surface: keyof ToothState['surfaces']) => void;
    onToothClick?: (toothId: number) => void;
    className?: string;
}

const getSurfaceClasses = (state: SurfaceState) => {
    switch (state) {
        case 'caries':
            // Blue fill based on reference image
            return 'fill-blue-600 hover:fill-blue-500 stroke-blue-600 stroke-1';
        case 'filled':
            // Red fill (similar to caries but red)
            return 'fill-red-600 hover:fill-red-500 stroke-red-600 stroke-1';
        case 'endodontics':
            return 'fill-purple-500 hover:fill-purple-400 stroke-gray-300 stroke-1';
        case 'sealant':
            return 'fill-green-300 hover:fill-green-200 stroke-gray-300 stroke-1';
        default:
            return 'fill-white hover:fill-gray-100 dark:fill-gray-800 dark:hover:fill-gray-700 stroke-gray-300 stroke-1';
    }
};

export function Tooth({ data, onSurfaceClick, onToothClick, className }: ToothProps) {
    const isMissing = data.condition === 'missing';
    const isExtraction = data.condition === 'extraction';
    const isCrown = data.condition === 'crown';

    // Base wrapper size increased by ~20% (w-10 -> w-12)
    return (
        <div className={cn("relative flex flex-col items-center group", className)}>
            <div className="relative">
                <svg
                    viewBox="0 0 100 100"
                    className="w-12 h-12 drop-shadow-sm cursor-pointer transition-transform group-hover:scale-105"
                >
                    <defs>
                        <pattern id="diagonal-red" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="2" />
                        </pattern>
                    </defs>

                    {/* Top (Vestibular/Lingual) */}
                    <path
                        d="M20,20 L80,20 L70,30 L30,30 Z"
                        className={cn("transition-colors", getSurfaceClasses(data.surfaces.top))}
                        onClick={() => onSurfaceClick(data.id, 'top')}
                    />

                    {/* Bottom */}
                    <path
                        d="M20,80 L80,80 L70,70 L30,70 Z"
                        className={cn("transition-colors", getSurfaceClasses(data.surfaces.bottom))}
                        onClick={() => onSurfaceClick(data.id, 'bottom')}
                    />

                    {/* Left */}
                    <path
                        d="M20,20 L30,30 L30,70 L20,80 Z"
                        className={cn("transition-colors", getSurfaceClasses(data.surfaces.left))}
                        onClick={() => onSurfaceClick(data.id, 'left')}
                    />

                    {/* Right */}
                    <path
                        d="M80,20 L70,30 L70,70 L80,80 Z"
                        className={cn("transition-colors", getSurfaceClasses(data.surfaces.right))}
                        onClick={() => onSurfaceClick(data.id, 'right')}
                    />

                    {/* Center (Occlusal) */}
                    <rect
                        x="30" y="30" width="40" height="40"
                        className={cn("transition-colors", getSurfaceClasses(data.surfaces.center))}
                        onClick={() => onSurfaceClick(data.id, 'center')}
                    />
                </svg>

                {/* Overlays for conditions over the entire tooth */}

                {/* Extraction: Two Blue Horizontal Lines */}
                {isExtraction && (
                    <div
                        className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none"
                        onClick={(e) => { e.stopPropagation(); onToothClick?.(data.id); }}
                    >
                        <div className="w-full h-1 bg-blue-600 mb-2"></div>
                        <div className="w-full h-1 bg-blue-600"></div>
                    </div>
                )}

                {/* Crown: Red Circle */}
                {isCrown && (
                    <div
                        className="absolute inset-0 flex justify-center items-center pointer-events-none"
                    >
                        <div className="w-10 h-10 rounded-full border-4 border-red-500"></div>
                    </div>
                )}

                {/* Missing: Red Cross (X) */}
                {isMissing && (
                    <div
                        className="absolute inset-0 flex justify-center items-center pointer-events-none bg-white/80 dark:bg-gray-900/80"
                    >
                        <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                )}

                {/* Click handler for whole tooth toggling if needed (using transparent overlay) */}
                <div
                    className="absolute inset-0 cursor-pointer z-50"
                    onClick={(e) => {
                        // Pass click to parent handler only if it hit the overlay area (central)
                        // But here we want to allow clicking surfaces too.
                        // So we should NOT block clicks.
                        // Actually, for whole-tooth tools (extract, etc.), Odontogram.tsx handles 'handleToothClick'.
                        // We need a way to capture the click on the whole element if we are in that mode.
                        // But since SVG paths have onClick, those will fire.
                        // In Odontogram.tsx, handleSurfaceClick checks tool mode and calls handleToothClick if extract/crown/etc.
                        // So we don't need a covering div here, EXCEPT for when the tooth is 'missing' or covered?
                        // No, just let the SVG paths handle clicks.
                    }}
                    style={{ pointerEvents: 'none' }} // Let clicks pass through to SVG
                />
            </div>

            <span className="text-[10px] text-gray-500 mt-1 font-medium">{data.id}</span>
        </div>
    );
}
