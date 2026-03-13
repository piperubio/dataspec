export interface WorkspaceResources {
    sources: string[];
    datasets: string[];
    contracts: string[];
    flows: string[];
    platformYaml: string | null;
}
export declare function scanWorkspace(dirPath: string): Promise<WorkspaceResources>;
export declare function readYamlFile(filePath: string): Promise<string>;
//# sourceMappingURL=scanner.d.ts.map