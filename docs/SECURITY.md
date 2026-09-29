# Security and privacy

V1 has no server and no account login. Anyone who can unlock the device/browser profile can access its local admin data. Use OS security, separate browser profiles, and secure backups. Do not deploy the admin as a shared public application without real server authentication and authorization.

The public site contains only approved concept content. It has no API route into admin IndexedDB. Contact data is placed in an email draft and is not sent to any site backend. Backups use AES-256-GCM with a password-derived key (PBKDF2-SHA256, 310,000 iterations) and contain personal and financial data. The password is never stored. Do not commit backup files, email them casually, or place them in a public folder. An unlocked device/browser profile still exposes local data.

A future private API needs authenticated secure sessions, MFA/passkeys where appropriate, authorization per resource, API validation, CSRF protection for cookie auth, rate limits, security headers, audit logs, and secret management. Public portfolio queries must use a distinct API role with only approved public records; never grant direct access to private CRM, invoices, payments, service records, or customer tables. Consider separate database schemas or databases and row level security. Search engines and analytics must never receive private fields.
