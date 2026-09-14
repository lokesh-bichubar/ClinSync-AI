# Security and real-patient-data deployment gates

**This build is restricted to synthetic/properly de-identified testing. It is not production healthcare software.** The declaration is a user attestation, not automatic de-identification or a compliance control. This file is an engineering checklist, not legal advice or certification.

## Decisions required before building the real-data version

1. **Hosting and jurisdiction:** organization-owned infrastructure, intended country/region, data residency and transfer constraints, private-network access, and responsible security/privacy contacts.
2. **Identity and authorization:** individual user identities, SSO/MFA, roles, patient/record access rules, session revocation, and administrator separation. The shared test password in this build is not sufficient.
3. **Purpose and approvals:** authorized documentation purpose, appropriate lawful basis/consents, organizational approvals, applicable privacy/health-record requirements, and a privacy impact assessment where required.
4. **AI provider approval:** organizational OpenAI project, approved models/endpoints, contractual data-processing terms, applicable healthcare arrangements, retention controls, subprocessors, and geographic processing restrictions. Confirm the actual account configuration; `store: false` alone is insufficient.
5. **Record lifecycle:** what must be persisted, for how long, where, and by whom; deletion/backups, audit requirements, export restrictions, and EHR integration. This prototype has no patient-data database or reliable audit record.
6. **Clinical ownership:** responsible reviewers, validation dataset, acceptable error rates, escalation policy, sign-off workflow, and a change-control process for prompts/models.

## Engineering work still needed

- Deploy behind TLS with controlled ingress; validate hostnames and trusted proxies.
- Add a production frame-embedding policy (`frame-ancestors`), HSTS, hardened secrets management, and environment separation. Embedding is deliberately not blocked in this development preview.
- Replace shared-password access with per-user SSO/MFA and record-level authorization. Use server-side revocable sessions, account-specific rate limits, and an audited session lifecycle.
- Add PHI/PII handling controls, consent enforcement as appropriate, secure upload scanning, and reviewed data-minimization practices. Do not rely on a prompt or a checkbox to remove identifiers.
- Review all logs, monitoring agents, proxies, crash dumps, and support tools for sensitive-data exposure. Implement an approved audit trail without casually duplicating patient data in logs.
- If persistence is required, implement encryption, key rotation, tenant separation, retention/deletion, secure backup/restore, and auditable access.
- Implement reliable task cancellation, durable job control if needed, request timeouts/body-read limits at the proxy, provider spend controls, and distributed rate limiting. Current global in-memory windows are for one worker and are susceptible to denial-of-service.
- Run security testing, dependency review, prompt-injection tests, and abuse testing. Treat both source documents and model outputs as untrusted.
- Validate extraction accuracy, negation, dates, medication dose/status, allergy wording, conflicting source handling, and omission risk using representative approved data. Literal quote matching is not semantic verification.
- Require authenticated reviewer approval with versioned source snapshots and traceable edits before any EHR write. This build's checkboxes and downloads are not sign-off records.
- Establish incident response, breach procedures, access reviews, business continuity, staff training, and ongoing model quality monitoring.

## Controls already present (limited scope)

The API key stays server-side; application patient-data persistence is absent; credentials are not embedded in the client. The app has a shared-password processing gate, signed HttpOnly same-site session cookies, CSRF checks, bounded JSON input, two concurrent AI requests, coarse rate limits, no-store response headers, basic CSP, explicit user-declaration checks, structured-output validation, and exact quote matching. Provider and validation errors are sanitized rather than echoing submitted documents. Frontend content is rendered with text nodes, not untrusted HTML.

These reduce common prototype risks. They do not establish compliance, zero retention, clinical safety, or suitability for real patient data.
