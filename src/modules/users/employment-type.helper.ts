import { EMPLOYMENT_TYPE } from 'src/database/postgres/entities/user.entity';

/**
 * Decide a user's employmentType from their email and the EMPLOYEE_DOMAINS
 * env var. Exact-suffix match, case-insensitive, no wildcards.
 *
 * No env var → defaults to 'pdsl.com'.
 * Empty/missing email → CONTRACTOR (safer default than EMPLOYEE).
 */
export function deriveEmploymentType(email: string | null | undefined): EMPLOYMENT_TYPE {
    if (!email) return EMPLOYMENT_TYPE.CONTRACTOR;
    const normalized = email.trim().toLowerCase();
    const domains = (process.env.EMPLOYEE_DOMAINS ?? 'pdsl.com')
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
    if (domains.length === 0) domains.push('pdsl.com');
    for (const d of domains) {
        if (normalized.endsWith('@' + d)) return EMPLOYMENT_TYPE.EMPLOYEE;
    }
    return EMPLOYMENT_TYPE.CONTRACTOR;
}
