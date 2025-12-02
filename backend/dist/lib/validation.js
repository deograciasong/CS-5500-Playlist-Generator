export function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
export function extractStringFields(source, fields) {
    const values = {};
    const missing = [];
    for (const field of fields) {
        const raw = source[field];
        if (isNonEmptyString(raw)) {
            values[field] = raw;
        }
        else {
            missing.push(field);
        }
    }
    return { values, missing };
}
export function describeFieldPresence(fields, missing) {
    const missingSet = new Set(missing);
    return fields.reduce((acc, field) => {
        acc[field] = !missingSet.has(field);
        return acc;
    }, {});
}
//# sourceMappingURL=validation.js.map