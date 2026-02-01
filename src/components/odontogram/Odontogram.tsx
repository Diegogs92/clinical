// Imports fixed
import React, { useState, useEffect } from 'react';
import { Tooth } from './Tooth';
import { ToothState, ToothSurfaces, SurfaceState } from '@/types/odontogram';
import { cn } from '@/lib/utils';

// Helper to generate initial empty state
const generateInitialTeeth = (): Record<number, ToothState> => {
    const teeth: Record<number, ToothState> = {};
    // Permanent teeth (1-8)
    [1, 2, 3, 4].forEach(q => {
        for (let i = 1; i <= 8; i++) {
            const id = q * 10 + i;
            teeth[id] = {
                id,
                type: 'permanent',
                surfaces: { top: 'healthy', bottom: 'healthy', left: 'healthy', right: 'healthy', center: 'healthy' },
                condition: 'healthy'
            };
        }
    });
    // Primary teeth (1-5)
    [5, 6, 7, 8].forEach(q => {
        for (let i = 1; i <= 5; i++) {
            const id = q * 10 + i;
            teeth[id] = {
                id,
                type: 'temporary',
                surfaces: { top: 'healthy', bottom: 'healthy', left: 'healthy', right: 'healthy', center: 'healthy' },
                condition: 'healthy'
            };
        }
    });
    return teeth;
};

type ToolType = 'caries' | 'filled' | 'endodontics' | 'sealant' | 'cleaning' | 'extract' | 'crown' | 'extraction';

interface OdontogramProps {
    initialData?: Record<number, ToothState>;
    onDataChange?: (data: Record<number, ToothState>) => void;
}


export default function Odontogram({ initialData, onDataChange }: OdontogramProps) {
    const [teeth, setTeeth] = useState<Record<number, ToothState>>(initialData || generateInitialTeeth());
    const [selectedTool, setSelectedTool] = useState<ToolType>('caries');
    // const [view, setView] = useState<'permanent' | 'mixed'>('permanent'); // Removed view state, showing all by default or layout based

    // Propagate changes
    useEffect(() => {
        if (onDataChange) {
            onDataChange(teeth);
        }
    }, [teeth, onDataChange]);

    const handleSurfaceClick = (toothId: number, surface: keyof ToothSurfaces) => {
        // Condition-setting tools
        // Condition-setting tools
        console.log('[Odontogram] handleSurfaceClick', { toothId, surface, selectedTool });
        if (selectedTool === 'extract' || selectedTool === 'extraction' || selectedTool === 'crown') {
            handleToothClick(toothId);
            return;
        }

        if (selectedTool === 'cleaning') {
            setTeeth(prev => {
                const tooth = prev[toothId];
                // If the tooth has a global condition (missing, crown, etc.), reset it to healthy first.
                // We don't necessarily clear surfaces here to avoid accidental data loss, 
                // but usually "cleaning" a missing tooth might mean "it's not missing anymore".
                console.log('[Odontogram] cleaning', toothId, tooth.condition);
                if (tooth.condition !== 'healthy') {
                    return {
                        ...prev,
                        [toothId]: {
                            ...tooth,
                            condition: 'healthy'
                        }
                    };
                }

                // If condition is already healthy, clean the specific surface
                return {
                    ...prev,
                    [toothId]: {
                        ...tooth,
                        surfaces: {
                            ...tooth.surfaces,
                            [surface]: 'healthy'
                        }
                    }
                };
            });
            return;
        }

        setTeeth(prev => {
            const tooth = prev[toothId];
            const newSurfaces = { ...tooth.surfaces };

            const targetState: SurfaceState = selectedTool as SurfaceState;

            newSurfaces[surface] = targetState;

            return {
                ...prev,
                [toothId]: { ...tooth, surfaces: newSurfaces }
            };
        });
    };

    const handleToothClick = (toothId: number) => {
        // Handle whole-tooth conditions
        if (selectedTool === 'extract') {
            // "Missing"
            setTeeth(prev => ({
                ...prev,
                [toothId]: {
                    ...prev[toothId],
                    condition: prev[toothId].condition === 'missing' ? 'healthy' : 'missing'
                }
            }));
        } else if (selectedTool === 'extraction') {
            // "Extraction Needed" (Two blue lines)
            setTeeth(prev => ({
                ...prev,
                [toothId]: {
                    ...prev[toothId],
                    condition: prev[toothId].condition === 'extraction' ? 'healthy' : 'extraction'
                }
            }));
        } else if (selectedTool === 'crown') {
            setTeeth(prev => ({
                ...prev,
                [toothId]: {
                    ...prev[toothId],
                    condition: prev[toothId].condition === 'crown' ? 'healthy' : 'crown'
                }
            }));
        }
    };

    const tools: { id: ToolType; label: string; color: string }[] = [
        { id: 'caries', label: 'Caries (Azul Sólido)', color: 'bg-blue-600 text-white' },
        { id: 'filled', label: 'Arreglo (Rojo Sólido)', color: 'bg-red-600 text-white' },
        { id: 'extraction', label: 'Extracción (2 Líneas Azules)', color: 'bg-blue-600 text-white' },
        { id: 'crown', label: 'Corona (Círculo Rojo)', color: 'bg-white border-2 border-red-500 text-red-500' },
        { id: 'extract', label: 'Ausente (Cruz Roja)', color: 'bg-red-100 text-red-600' },
        { id: 'cleaning', label: 'Borrar/Limpiar', color: 'bg-white border text-gray-700' },
    ];

    // Helper to render a quadrant
    const renderQuadrant = (start: number, end: number, reverse: boolean = false) => {
        const ids = [];
        if (reverse) {
            for (let i = start; i >= end; i--) ids.push(i);
        } else {
            for (let i = start; i <= end; i++) ids.push(i);
        }

        return (
            <div className="flex gap-1">
                {ids.map(id => (
                    <Tooth
                        key={id}
                        data={teeth[id]}
                        onSurfaceClick={handleSurfaceClick}
                        onToothClick={handleToothClick}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 p-6 bg-white dark:bg-elegant-900 rounded-xl border border-elegant-200 dark:border-elegant-800">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-sm",
                            selectedTool === tool.id
                                ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 transform scale-105"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700 opacity-80 hover:opacity-100",
                            tool.color
                        )}
                    >
                        {tool.label}
                    </button>
                ))}
            </div>

            {/* Odontogram Visual */}
            {/* We need to arrange it: Q1 | Q2, then Q5 | Q6 (Primary Top), then Q8 | Q7 (Primary Bottom), then Q4 | Q3 */}
            <div className="flex flex-col gap-6 items-center overflow-x-auto pb-4 w-full">

                {/* Permanent Upper (18-11 | 21-28) */}
                <div className="flex gap-4 items-start">
                    <div className="flex flex-col gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400 mr-2 pt-1">
                        <div className="h-3 flex items-center">V</div>
                        <div className="h-3 flex items-center">P</div>
                        <div className="h-3 flex items-center">L</div>
                        <div className="h-3 flex items-center">V</div>
                    </div>
                    <div className="flex gap-12 md:gap-24">
                        <div className="flex justify-end">{renderQuadrant(18, 11, true)}</div>
                        <div className="flex justify-start">{renderQuadrant(21, 28, false)}</div>
                    </div>
                </div>

                {/* Permanent Lower (48-41 | 31-38) */}
                <div className="flex gap-4 items-start">
                    <div className="flex flex-col gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400 mr-2 pt-1">
                        <div className="h-3 flex items-center">V</div>
                        <div className="h-3 flex items-center">P</div>
                        <div className="h-3 flex items-center">L</div>
                        <div className="h-3 flex items-center">V</div>
                    </div>
                    <div className="flex gap-12 md:gap-24">
                        <div className="flex justify-end">{renderQuadrant(48, 41, true)}</div>
                        <div className="flex justify-start">{renderQuadrant(31, 38, false)}</div>
                    </div>
                </div>

                {/* Primary Upper (55-51 | 61-65) */}
                <div className="flex gap-4 items-start">
                    <div className="flex flex-col gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400 mr-2 pt-1">
                        <div className="h-3 flex items-center">V</div>
                        <div className="h-3 flex items-center">P</div>
                        <div className="h-3 flex items-center">L</div>
                        <div className="h-3 flex items-center">V</div>
                    </div>
                    <div className="flex gap-8 md:gap-16 justify-center">
                        <div className="flex justify-end">{renderQuadrant(55, 51, true)}</div>
                        <div className="flex justify-start">{renderQuadrant(61, 65, false)}</div>
                    </div>
                </div>

                {/* Center Label */}
                <div className="text-xs text-gray-400 font-mono tracking-widest uppercase text-center border-t border-b border-gray-100 dark:border-gray-800 w-full py-2 my-2">
                    Derecha &mdash; Izquierda
                </div>

                {/* Primary Lower (85-81 | 71-75) */}
                <div className="flex gap-4 items-start">
                    <div className="flex flex-col gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400 mr-2 pt-1">
                        <div className="h-3 flex items-center">V</div>
                        <div className="h-3 flex items-center">P</div>
                        <div className="h-3 flex items-center">L</div>
                        <div className="h-3 flex items-center">V</div>
                    </div>
                    <div className="flex gap-8 md:gap-16 justify-center">
                        <div className="flex justify-end">{renderQuadrant(85, 81, true)}</div>
                        <div className="flex justify-start">{renderQuadrant(71, 75, false)}</div>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-gray-400">
                Selecciona una herramienta y marca los dientes o superficies correspondientes.
            </div>
        </div>
    );
}
