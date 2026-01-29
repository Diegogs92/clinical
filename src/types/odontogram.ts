export type ToothCondition = 'healthy' | 'missing' | 'implant' | 'crown' | 'bridge';
export type SurfaceState = 'healthy' | 'caries' | 'filled' | 'endodontics' | 'sealant';

export interface ToothSurfaces {
    top: SurfaceState;
    bottom: SurfaceState;
    left: SurfaceState;
    right: SurfaceState;
    center: SurfaceState;
}

export interface ToothState {
    id: number;
    type: 'permanent' | 'temporary';
    surfaces: ToothSurfaces;
    condition: ToothCondition;
    notes?: string;
}

export interface OdontogramData {
    patientId: string;
    teeth: Record<number, ToothState>;
    updatedAt: string;
    updatedBy: string;
}
