import React from 'react';
import { ToothState, SurfaceState } from '@/types/odontogram';
import { cn } from '@/lib/utils';

interface ToothProps {
    data: ToothState;
    onSurfaceClick: (toothId: number, surface: keyof ToothState['surfaces']) => void;
    onToothClick?: (toothId: number) => void;
    className?: string;
}

const getSurfaceColor = (state: SurfaceState) => {
    switch (state) {
        case 'caries': return 'fill-red-500 hover:fill-red-400';
        case 'filled': return 'fill-blue-500 hover:fill-blue-400';
        case 'endodontics': return 'fill-purple-500 hover:fill-purple-400';
        case 'sealant': return 'fill-green-300 hover:fill-green-200';
        default: return 'fill-white hover:fill-gray-100 dark:fill-gray-800 dark:hover:fill-gray-700';
    }
};

export function Tooth({ data, onSurfaceClick, onToothClick, className }: ToothProps) {
    const isMissing = data.condition === 'missing';

    if (isMissing) {
        return (
            <div
                className={cn("relative w-10 h-10 flex items-center justify-center cursor-pointer opacity-50", className)}
                onClick={() => onToothClick?.(data.id)}
            >
                <span className="text-red-500 font-bold text-xl">X</span>
                <span className="absolute -bottom-4 text-xs text-gray-500">{data.id}</span>
            </div>
        );
    }

    return (
        <div className={cn("relative flex flex-col items-center", className)}>
            <svg
                viewBox="0 0 100 100"
                className="w-10 h-10 drop-shadow-sm cursor-pointer"
            >
                {/* Top (Vestibular/Lingual depending on arch) */}
                <path
                    d="M20,20 L80,20 L70,30 L30,30 Z"
                    className={cn("stroke-gray-300 stroke-1 transition-colors", getSurfaceColor(data.surfaces.top))}
                    onClick={() => onSurfaceClick(data.id, 'top')}
                />

                {/* Bottom */}
                <path
                    d="M20,80 L80,80 L70,70 L30,70 Z"
                    className={cn("stroke-gray-300 stroke-1 transition-colors", getSurfaceColor(data.surfaces.bottom))}
                    onClick={() => onSurfaceClick(data.id, 'bottom')}
                />

                {/* Left (Distal/Mesial) */}
                <path
                    d="M20,20 L30,30 L30,70 L20,80 Z"
                    className={cn("stroke-gray-300 stroke-1 transition-colors", getSurfaceColor(data.surfaces.left))}
                    onClick={() => onSurfaceClick(data.id, 'left')}
                />

                {/* Right */}
                <path
                    d="M80,20 L70,30 L70,70 L80,80 Z"
                    className={cn("stroke-gray-300 stroke-1 transition-colors", getSurfaceColor(data.surfaces.right))}
                    onClick={() => onSurfaceClick(data.id, 'right')}
                />

                {/* Center (Occlusal) */}
                <rect
                    x="30" y="30" width="40" height="40"
                    className={cn("stroke-gray-300 stroke-1 transition-colors", getSurfaceColor(data.surfaces.center))}
                    onClick={() => onSurfaceClick(data.id, 'center')}
                />
            </svg>
            <span className="text-[10px] text-gray-500 mt-1">{data.id}</span>
        </div>
    );
}
