import YAML from 'yaml';
export function parseYamlWithLineNumbers(content) {
    const errors = [];
    try {
        const doc = YAML.parseDocument(content);
        if (doc.errors.length > 0) {
            for (const err of doc.errors) {
                errors.push(`YAML parse error at line ${err.linePos?.[0]?.line}: ${err.message}`);
            }
        }
        const data = doc.toJS();
        return { data, errors };
    }
    catch (e) {
        const error = e;
        errors.push(`Parse error: ${error.message}`);
        return { data: null, errors };
    }
}
export function getLineNumber(content, path) {
    const doc = YAML.parseDocument(content);
    const node = doc.getIn(path);
    if (node && typeof node === 'object' && 'range' in node && node.range && typeof node.range === 'object' && 'start' in node.range) {
        const lines = content.substring(0, node.range.start).split('\n');
        return lines.length;
    }
    return 1;
}
//# sourceMappingURL=yaml.js.map