# Admin guide

Enter business details in Settings. Add clients, then projects, quotes, invoices, payments, expenses and renewal service records. Line items use `description | quantity | rate`, as separate rows. Accept a quote before converting it to a draft invoice. Payments must match invoice currency and cannot exceed its total. Finalized invoices are voided instead of deleted. The PDF action downloads a basic offline PDF. Reports and dashboard totals use the configured currency only and do not silently combine currencies.

Use Backup > Export backup to save all tables and settings. Restore validates the format and replaces all local records after confirmation. The exported file is encrypted with a password you choose. The password is not stored and cannot be recovered. Store both file and password securely. CSV exports are available for clients, invoices, payments and renewals. Demo records can be loaded and removed from Backup.

The admin stores document metadata and links, not large binaries. Service notes must never contain passwords, API secrets, or private keys. This app is private only in the sense that its data remains in this browser; device access gives data access.
