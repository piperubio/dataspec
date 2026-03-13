export interface YamlNode {
    value: unknown;
    lineNumber: number;
    columnNumber: number;
}
export interface ParseResult<T> {
    data: T;
    errors: string[];
}
export declare function parseYamlWithLineNumbers<T>(content: string): ParseResult<T>;
export declare function getLineNumber(content: string, path: string[]): number;
//# sourceMappingURL=yaml.d.ts.map