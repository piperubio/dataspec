export function createGraph() {
    return {
        nodes: new Map(),
        edges: [],
    };
}
export function addNode(graph, node) {
    const key = `${node.type}:${node.name}`;
    graph.nodes.set(key, node);
}
export function addEdge(graph, edge) {
    graph.edges.push(edge);
}
export function getNode(graph, type, name) {
    return graph.nodes.get(`${type}:${name}`);
}
export function getOutgoingEdges(graph, nodeId) {
    return graph.edges.filter(e => e.from === nodeId);
}
export function getIncomingEdges(graph, nodeId) {
    return graph.edges.filter(e => e.to === nodeId);
}
export function getUpstream(graph, startNodeId) {
    const visited = new Set();
    const result = [];
    function traverse(nodeId) {
        if (visited.has(nodeId))
            return;
        visited.add(nodeId);
        const incoming = getIncomingEdges(graph, nodeId);
        for (const edge of incoming) {
            const node = graph.nodes.get(edge.from);
            if (node) {
                result.push(node);
                traverse(edge.from);
            }
        }
    }
    traverse(startNodeId);
    return result;
}
export function getDownstream(graph, startNodeId) {
    const visited = new Set();
    const result = [];
    function traverse(nodeId) {
        if (visited.has(nodeId))
            return;
        visited.add(nodeId);
        const outgoing = getOutgoingEdges(graph, nodeId);
        for (const edge of outgoing) {
            const node = graph.nodes.get(edge.to);
            if (node) {
                result.push(node);
                traverse(edge.to);
            }
        }
    }
    traverse(startNodeId);
    return result;
}
//# sourceMappingURL=types.js.map