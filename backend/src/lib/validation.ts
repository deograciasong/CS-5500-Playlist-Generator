export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function extractStringFields<const K extends string>(
  source: Record<string, unknown>,
  fields: readonly K[],
) {
  const values = {} as Record<K, string>;
  const missing: K[] = [];

  for (const field of fields) {
    const raw = source[field];
    if (isNonEmptyString(raw)) {
      values[field] = raw;
    } else {
      missing.push(field);
    }
  }

  return { values, missing };
}

export function describeFieldPresence(
  fields: readonly string[],
  missing: readonly string[],
): Record<string, boolean> {
  const missingSet = new Set(missing);
  return fields.reduce<Record<string, boolean>>((acc, field) => {
    acc[field] = !missingSet.has(field);
    return acc;
  }, {});
}
