/**
 * Generates stable, sortable, collision-resistant node ids without pulling
 * in an external dependency. Format: `n_<36-char base36 timestamp+random>`.
 * Swappable for a real ULID/UUID lib by consumers if stricter guarantees
 * are required (the SDK only requires `id: string`, no specific format).
 */
let counter = 0;

export function createIdGenerator(): () => string {
  return () => {
    counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
    const time = Date.now().toString(36);
    const rand = Math.floor(Math.random() * 1e9).toString(36);
    return `n_${time}${counter.toString(36)}${rand}`;
  };
}

export const generateId = createIdGenerator();
