/**
 * Build a username from a full name + employee id.
 *
 *   slug(fullName) || '.' || employeeId
 *
 * `slug(s)` lowercases, replaces any run of non `[a-z0-9]` with a single dot,
 * and trims leading/trailing dots. Falls back to the email local-part when
 * fullName is empty, and to 'user' when both are missing. The caller is
 * responsible for supplying a valid employee id (4-5 digits).
 */
export function buildUsername(opts: { fullName?: string | null; email?: string | null; employeeId?: string | null }): string | null {
    const empId = (opts.employeeId ?? '').trim();
    if (!empId) return null;

    const slugify = (s: string): string => s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .replace(/\.+/g, '.');

    let base = slugify(opts.fullName ?? '');
    if (!base && opts.email) {
        base = slugify(opts.email.split('@')[0] ?? '');
    }
    if (!base) base = 'user';

    return `${base}.${empId}`.slice(0, 64);
}
