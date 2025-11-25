export declare function isNonEmptyString(value: unknown): value is string;
export declare function extractStringFields<const K extends string>(source: Record<string, unknown>, fields: readonly K[]): {
    values: Record<K, string>;
    missing: K[];
};
export declare function describeFieldPresence(fields: readonly string[], missing: readonly string[]): Record<string, boolean>;
//# sourceMappingURL=validation.d.ts.map