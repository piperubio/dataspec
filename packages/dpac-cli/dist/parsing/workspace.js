import { readYamlFile, scanWorkspace } from './scanner.js';
import { parseYamlWithLineNumbers } from './yaml.js';
export async function parseWorkspace(dirPath) {
    const resources = await scanWorkspace(dirPath);
    const workspace = {
        platform: null,
        sources: [],
        datasets: [],
        contracts: [],
        flows: [],
        rootPath: dirPath,
    };
    if (resources.platformYaml) {
        const content = await readYamlFile(resources.platformYaml);
        const result = parseYamlWithLineNumbers(content);
        if (result.errors.length === 0 && result.data) {
            workspace.platform = {
                ...result.data,
                file: resources.platformYaml,
                line: 1,
            };
        }
    }
    for (const file of resources.sources) {
        const content = await readYamlFile(file);
        const result = parseYamlWithLineNumbers(content);
        if (result.errors.length === 0 && result.data) {
            workspace.sources.push({
                ...result.data,
                file,
                line: 1,
            });
        }
    }
    for (const file of resources.datasets) {
        const content = await readYamlFile(file);
        const result = parseYamlWithLineNumbers(content);
        if (result.errors.length === 0 && result.data) {
            workspace.datasets.push({
                ...result.data,
                file,
                line: 1,
            });
        }
    }
    for (const file of resources.contracts) {
        const content = await readYamlFile(file);
        const result = parseYamlWithLineNumbers(content);
        if (result.errors.length === 0 && result.data) {
            workspace.contracts.push({
                ...result.data,
                file,
                line: 1,
            });
        }
    }
    for (const file of resources.flows) {
        const content = await readYamlFile(file);
        const result = parseYamlWithLineNumbers(content);
        if (result.errors.length === 0 && result.data) {
            workspace.flows.push({
                ...result.data,
                file,
                line: 1,
            });
        }
    }
    return workspace;
}
//# sourceMappingURL=workspace.js.map