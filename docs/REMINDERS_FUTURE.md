# Future reminders

Current calculations live in `admin/src/domain.mjs`. Introduce a `ReminderProvider` contract; `LocalReminderProvider` can call browser notifications while open. A future `CloudReminderProvider` should use a scheduled server worker and transactional email service, deduplicate jobs by record/expiry/interval, record delivery state, and respect time zones, consent and retry policy. The backend must authenticate before exposing private service information.
