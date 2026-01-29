// Imports fixed
import React, { useState, useEffect } from 'react';
import { Tooth } from './Tooth';
import { ToothState, ToothSurfaces, SurfaceState } from '@/types/odontogram';
import { cn } from '@/lib/utils';

// Helper to generate initial empty state
const generateInitialTeeth = (): Record<number, ToothState> => {
    const teeth: Record<number, ToothState> = {};
    // Permanent teeth
    const quadrants = [1, 2, 3, 4];
    quadrants.forEach(q => {
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
    return teeth;
};

type ToolType = 'caries' | 'filled' | 'endodontics' | 'sealant' | 'cleaning' | 'extract';

interface OdontogramProps {
    initialData?: Record<number, ToothState>;
    onDataChange?: (data: Record<number, ToothState>) => void;
}


export default function Odontogram({ initialData, onDataChange }: OdontogramProps) {
    const [teeth, setTeeth] = useState<Record<number, ToothState>>(initialData || generateInitialTeeth());
    const [selectedTool, setSelectedTool] = useState<ToolType>('caries');
    const [view, setView] = useState<'permanent' | 'mixed'>('permanent');

    // Propagate changes
    useEffect(() => {
        if (onDataChange) {
            onDataChange(teeth);
        }
    }, [teeth, onDataChange]);

    const handleSurfaceClick = (toothId: number, surface: keyof ToothSurfaces) => {
        // If tool is extract, we treat any surface click as a tooth click
        if (selectedTool === 'extract') {
            handleToothClick(toothId);
            return;
        }

        setTeeth(prev => {
            const tooth = prev[toothId];
            const newSurfaces = { ...tooth.surfaces };

            // Toggle logic: if clicking with same tool on same state, optional revert? 
            // For now simple overwrite
            // If tool is 'cleaning', set to healthy
            const targetState: SurfaceState = selectedTool === 'cleaning' ? 'healthy' : selectedTool as SurfaceState;

            newSurfaces[surface] = targetState;

            return {
                ...prev,
                [toothId]: { ...tooth, surfaces: newSurfaces }
            };
        });
    };

    const handleToothClick = (toothId: number) => {
        // Only allow toggling missing state if tool is extract or regular click
        // If regular click (no tool selected) maybe select? For now strictly bind to 'extract' tool
        if (selectedTool === 'extract') {
            setTeeth(prev => ({
                ...prev,
                [toothId]: {
                    ...prev[toothId],
                    condition: prev[toothId].condition === 'missing' ? 'healthy' : 'missing'
                }
            }));
        }
    };

    const tools: { id: ToolType; label: string; color: string }[] = [
        { id: 'caries', label: 'Caries (Rojo)', color: 'bg-red-500' },
        { id: 'filled', label: 'Obturación (Azul)', color: 'bg-blue-500' },
        { id: 'endodontics', label: 'Endodoncia (Violeta)', color: 'bg-purple-500' },
        { id: 'sealant', label: 'Sellador (Verde)', color: 'bg-green-300' },
        { id: 'extract', label: 'Extraer (X)', color: 'bg-gray-800' },
        { id: 'cleaning', label: 'Borrar/Limpiar', color: 'bg-white border' },
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
            <div className="flex gap-1 md:gap-2">
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
        <div className="flex flex-col gap-6 p-4 bg-white dark:bg-elegant-900 rounded-xl border border-elegant-200 dark:border-elegant-800">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 items-center justify-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                            selectedTool === tool.id
                                ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 shadow-sm transform scale-105"
                                : "hover:bg-gray-200 dark:hover:bg-gray-700",
                            tool.id === 'cleaning' ? "text-gray-900 bg-white" : "text-white",
                            tool.id !== 'cleaning' && tool.color
                        )}
                    >
                        <div className={cn("w-3 h-3 rounded-full", tool.color)} />
                        {tool.label}
                    </button>
                ))}
            </div>

            {/* Odontogram Visual */}
            <div className="flex flex-col gap-8 items-center overflow-x-auto pb-4">
                {/* Upper Arch */}
                <div className="flex gap-8 md:gap-16">
                    {/* Q1: 18-11 */}
                    <div className="flex justify-end">{renderQuadrant(18, 11, true)}</div>
                    {/* Q2: 21-28 */}
                    <div className="flex justify-start">{renderQuadrant(21, 28, false)}</div>
                </div>

                <div className="text-xs text-gray-400 font-mono tracking-widest uppercase text-center border-t border-b border-gray-100 dark:border-gray-800 w-full py-1">
                    Boca (Izquierda &mdash; Derecha)
                </div>

                {/* Lower Arch */}
                <div className="flex gap-8 md:gap-16">
                    {/* Q4: 48-41 */}
                    <div className="flex justify-end">{renderQuadrant(48, 41, true)}</div>
                    {/* Q3: 31-38 */}
                    <div className="flex justify-start">{renderQuadrant(31, 38, false)}</div>
                </div>
            </div>

            <div className="text-center text-xs text-gray-400">
                Selecciona una herramienta y haz clic en las caras del diente. Usa "Extraer" para marcar pieza ausente.
            </div>
        </div>
    );
}
