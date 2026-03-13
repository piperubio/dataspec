import type { SourceEntity, FlowStep } from '@dataspec/dpac-core';
export interface ParsedSource {
    name: string;
    type: string;
    entities: SourceEntity[];
    file: string;
    line: number;
}
export interface ParsedDataset {
    name: string;
    layer: string;
    storage: {
        backend: string;
        format: string;
        location: string;
    };
    contract?: {
        name: string;
        version: string;
    };
    file: string;
    line: number;
}
export interface ParsedContract {
    name: string;
    version: string;
    fields: Array<{
        name: string;
        type: string;
        constraints?: Record<string, unknown>;
    }>;
    file: string;
    line: number;
}
export interface ParsedFlow {
    name: string;
    steps: FlowStep[];
    file: string;
    line: number;
}
export interface ParsedPlatform {
    name?: string;
    storage?: Array<{
        name: string;
        type: string;
    }>;
    engines?: Array<{
        name: string;
        type: string;
    }>;
    file: string;
    line: number;
}
export interface Workspace {
    platform: ParsedPlatform | null;
    sources: ParsedSource[];
    datasets: ParsedDataset[];
    contracts: ParsedContract[];
    flows: ParsedFlow[];
    rootPath: string;
}
export declare function parseWorkspace(dirPath: string): Promise<Workspace>;
//# sourceMappingURL=workspace.d.ts.map