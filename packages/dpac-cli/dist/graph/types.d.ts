export type ResourceType = 'source' | 'dataset' | 'contract' | 'flow';
export interface GraphNode {
    id: string;
    type: ResourceType;
    name: string;
    file: string;
    line: number;
}
export interface GraphEdge {
    from: string;
    to: string;
    type: 'references' | 'produces' | 'consumes';
}
export interface DependencyGraph {
    nodes: Map<string, GraphNode>;
    edges: GraphEdge[];
}
export declare function createGraph(): DependencyGraph;
export declare function addNode(graph: DependencyGraph, node: GraphNode): void;
export declare function addEdge(graph: DependencyGraph, edge: GraphEdge): void;
export declare function getNode(graph: DependencyGraph, type: ResourceType, name: string): GraphNode | undefined;
export declare function getOutgoingEdges(graph: DependencyGraph, nodeId: string): GraphEdge[];
export declare function getIncomingEdges(graph: DependencyGraph, nodeId: string): GraphEdge[];
export declare function getUpstream(graph: DependencyGraph, startNodeId: string): GraphNode[];
export declare function getDownstream(graph: DependencyGraph, startNodeId: string): GraphNode[];
//# sourceMappingURL=types.d.ts.map