# CEDA Innovation Management Platform — Frontend

**Burnz Nexus · Next.js + TailAdmin · CEDA Innovation Management Portal prototype**

> A secure, accessible and role-based interface for submitting, evaluating, tracking and managing innovations. This repository contains the **frontend only**. The system of record, workflow rules, review permissions and persistence are owned by a separate **Django + Django Ninja** backend.

## Project status

**Status:** Frontend development / integration planning. This README is the target implementation specification, **not** a claim that every screen or feature has already been built. Sections marked **Planned** require implementation and a backend API contract.

**Repository:** `BURNS-NEXUS/ceda-frontend` (private)

## Contents

- [Product overview](#product-overview)
- [Objectives and scope](#objectives-and-scope)
- [Technology](#technology)
- [Architecture](#architecture)
- [User roles and portals](#user-roles-and-portals)
- [Screen inventory](#screen-inventory)
- [Application and review lifecycle](#application-and-review-lifecycle)
- [Application form sections](#application-form-sections)
- [Evaluation rubric](#evaluation-rubric)
- [Frontend UX standards](#frontend-ux-standards)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Suggested project structure](#suggested-project-structure)
- [Backend integration](#backend-integration)
- [Authentication and security](#authentication-and-security)
- [Frontend data and state management](#frontend-data-and-state-management)
- [Testing and quality](#testing-and-quality)
- [Delivery roadmap](#delivery-roadmap)
- [Contribution and collaboration](#contribution-and-collaboration)
- [Acceptance checklist](#acceptance-checklist)
- [References and ownership](#references-and-ownership)
- [Decision tree (evolution)](#decision-tree-evolution)

## Decision tree (evolution)

This section is a living record of decisions made while the platform is being built. It exists because the design is evolving: an entry records **what was decided, why, and what it changed**, so earlier choices are not silently forgotten. Add a new row whenever a workflow, data model or integration choice is settled.

| # | Date | Area | Decision | Why | Effect |
|---|------|------|----------|-----|--------|
| 1 | 2026-11-23 | Backend of record | The Vercel-hosted Django API at `https://ceda-django-api.vercel.app` is the single source of truth. `https://ceda-api.bawetsi.com` is a **different server** and must never be called. | Avoids writing to/probing the wrong database. | `vercel.json` pins `BACKEND_API_ORIGIN`; the frontend never hard-codes the other host. |
| 2 | 2026-11-23 | API access | All browser API calls go through the same-origin `/api/backend/*` proxy with a strict endpoint allowlist; trailing slashes are preserved and cookies forwarded. | Keeps sessions working, avoids CORS, and prevents accidental calls to unconfirmed endpoints. | `src/app/api/backend/[...path]/route.ts`; unlisted paths 404. |
| 3 | 2026-11-23 | Data honesty | No mock/fake counts, saves or backend data. Screens that are not backed by a confirmed endpoint stay honest placeholders. | The demo must not claim functionality that does not exist. | Dashboards and registries derive from real Django responses. Unconfirmed `handoffApi.*` helpers remain unused. |
| 4 | 2026-11-23 | Seed data | Real demo records (programme calls, applications, document types) were seeded into the production DB with an **idempotent** Django command, not fabricated in the UI. | Screens were empty because the DB had users but no content. | `seed_demo_portal` + `test_seed_demo_portal`; 144 Django tests pass. |
| 5 | 2026-11-23 | Wizard validation | Required dates are validated **per step** before any save. Autosave silently skips a step whose required date is still empty; "Save draft" and "Save & continue" show a specific inline message. `handleSubmit` is no longer used for autosave (uses `getValues()` directly). | Django requires `date_of_incorporation`, `date_of_birth` and shareholder `dob`; empty strings produced `422 input is too short` and repeated autosave spam. | No invalid date reaches the backend; no misleading error banner while a user is still typing. |
| 6 | 2026-11-23 | Notifications | There is no backend notifications endpoint. The header dropdown is derived from `GET /api/applications/` + `GET /api/clarifications/` and is labelled as such. | A fake `/api/notifications/` would violate decision #3 (the proxy allowlist blocks it). | Each user sees notifications based on the applications/clarifications they are actually allowed to see. |
| 7 | 2026-11-23 | Workflow smoke test | Verified the full chain live through the proxy: customer submit → verifier accepts documents & verifies → two evaluators score & confirm → adjudicator decides & confirms → admin audit logs. State ended `accepted`; 8 audit-log entries recorded. | Confirms role boundaries and state transitions work against the real backend. | Admin audit trail and reports/dashboard return real data. |
| 8 | 2026-11-23 | Evaluator assignment | **Hybrid model chosen** (see below): auto-assign by sector expertise, evaluators may decline (task returns to pool) and claim extra work from a domain-filtered pool; admin can override. | Pure round-robin can assign an energy expert to a health project; pure self-selection risks cherry-picking and unclaimed applications. | Adds `User.expertise_sectors` (migration `0034`), sector inference, `pool`/`claim`/`decline`/`expertise` endpoints, and the evaluator Review queue UI. 150 Django tests pass. |
| 9 | 2026-11-23 | Decline vs conflict + claim cap | A **decline** only releases the assignment slot (no `ConflictDeclaration` record); a formal conflict remains a separate action. Claims are capped by `evaluators_per_application` (capacity), not by a per-reviewer quota. | Keeps the two actions distinct — "I can't take this now" vs "I have a conflict of interest" — and avoids a reviewer hoarding work. | `POST /api/tasks/{id}/decline` requires a reason (≥10 chars) and sets the task back to `pending`; `POST /api/tasks/{id}/claim` refuses when the task is full. |
| 10 | 2026-11-23 | Evaluator screen UX | The generic OpenAPI-driven `WorkflowOperations` panel is **not** shown on `evaluator/reviews` once a purpose-built screen exists. | It exposed raw API fields (`skip`, `take`, `task_type`, `assignee_id`, `unassigned`) as an "Action / List Tasks" form — a developer console, not reviewer UX. | That screen renders only `EvaluatorReviewQueue`; other demo screens still use the generic panel. |
| 11 | 2026-11-23 | Profile screen UX | `innovator/profile` now renders a purpose-built "Profile & organisation" screen (`src/components/burnz/profile/`) instead of the generic `WorkflowOperations` API console. | The old panel exposed applicant-record API paths as a developer form; it showed nothing about the signed-in user. | Account details come live from `GET /api/auth/me` + `GET /api/me/permissions`; organisation/contact details come from `GET /api/applications/` + `GET /api/applications/{id}`. Empty applicant records show "Not provided" honestly (decision #3). The `innovator/profile` entry and unused `applicantRecordPaths` were removed from `workflowPaths`. |
| 12 | 2026-11-23 | Notifications screen UX | `innovator/notifications` now renders a purpose-built screen (`src/components/burnz/notifications/`) instead of the generic `WorkflowOperations` "List Clarifications" console with raw `skip`, `take`, `application id`, `version` fields. | It was a developer API form, not user-facing notifications. | A readable timeline is derived from `GET /api/applications/` + `GET /api/clarifications/` (decision #6). Real workflow states map to accurate event-style wording ("Draft saved", "Application submitted", "Application accepted"); clarifications are joined to project titles. No invented history — a true per-user event history would need a new backend endpoint because customers get 403 on `/api/audit-logs/`. The `innovator/notifications` entry was removed from `workflowPaths`. |
| 13 | 2026-11-23 | Evaluation assignment (supersedes #8) | Submitted evaluations are **not auto-assigned**: `ensure_task_for_application()` leaves the evaluation task `PENDING` in `/api/tasks/pool` for **any** evaluator to claim. Expertise only ranks/filters the pool; it never forces an assignment. | Auto-matching an energy expert to a health project was wrong, and the shared pool keeps claiming explicit and fair while still surfacing relevant work first. | `retry_pending_tasks()` skips evaluation tasks; claim capacity is capped by `evaluators_per_application`. Queue copy now says "claimed from the shared pool", not "auto-matched". PR #3 merged; 151 Django tests pass. |
| 14 | 2026-11-23 | Editable profile (all roles) | Added a real `PATCH /api/me` for partial `first_name` / `last_name` / `email` updates (email format + uniqueness checked; `username` kept in sync with email). The profile edit form is available to **every** role — innovator/customer, evaluator, programme admin and adjudicator — via each role's profile screen. | The user must be able to update their own profile; the old screens were read-only or generic API consoles. No avatar upload exists because the backend has no file-storage endpoint, so none is offered (decision #3). | Organisation/contact editing uses the existing application PATCH and is limited to `draft`/`feedback` applications. New `UserPatchIn` schema + `UpdateMeTests` (155 Django tests pass); `/api/me` added to the proxy allowlist. |
| 15 | 2026-11-23 | Customer deletes own application | The customer applications list now has a per-row Delete action with a confirmation dialog, calling the existing `DELETE /api/applications/{id}`. | The user wants to remove their own applications. The backend already enforces `owner=request.auth`, so no new API was needed. | Only the owner can delete; all saved records for that application are removed. No fake "delete" state. |
| 16 | 2026-11-23 | Customer register + login | Registration (`POST /api/auth/register`) creates the session and adds the user to the `customer` group; on success the customer is signed straight in. Sign-in/sign-up now derive the portal role from `GET /api/me/permissions` instead of a hard-coded `@burnz.demo` email map. | The user wants customers to register and log in, and the seeded accounts use `@ceda.local`, so email-based role guessing broke staff logins. | New customers land in the innovator portal; seeded admin/evaluator/adjudicator accounts land in their correct portals based on real permissions. |
| 17 | 2026-11-23 | Verifier gate before evaluation | Evaluation work is only created **after** a verifier accepts the required documents and verifies the application (state → `evaluation`). Evaluators do **not** see raw customer drafts. They then voluntarily claim from the shared pool, ranked by declared sector expertise. | Experts should not score incomplete or ineligible records, and every evaluator must score the same verified version for a fair comparison. Voluntary, expertise-ranked claiming is preserved (decision #13) — the verifier is a completeness/eligibility gate, not a gatekeeper of evaluator choice. | Demonstrated end-to-end against production: uploaded 4 real PDFs to a draft, submitted as customer, accepted documents as the assigned verifier, verified → a real `PENDING` evaluation task appeared in `/api/tasks/pool` with `expertise_match: true`. Queue copy now says "Verified applications waiting for an evaluator". |
| 18 | 2026-11-23 | Review dashboards connected | Removed the stale `UnconnectedSummary` card that claimed "the published OpenAPI contract does not include review assignment, scoring or adjudication endpoints". Replaced with `ReviewSummary`, which derives evaluator/adjudicator dashboard metrics and lists from live tasks. | The live contract **does** publish `/api/tasks/*`, `/api/scoring-criteria`, `/api/applications/{id}/scorings*` and `/api/applications/{id}/adjudication*` (verified against `/api/openapi.json`); the old copy was false and breached decision #3 by understating real functionality. | Evaluator dashboard shows claim-pool / claimed / completed counts; adjudicator dashboard shows awaiting-decision / decided / total. No invented numbers. |
| 19 | 2026-11-23 | Purpose-built evaluator workflow screens | Replaced the generic OpenAPI console on `evaluator/reviews/workspace` and `evaluator/guidelines` with dedicated UI. Workspace: claimed applications by project name, read-only application record, downloadable evidence list (no in-app preview), criterion cards with labels/weights/max scores, draft save and final confirm. Guidelines: live rubric table plus confidentiality/fairness guidance. "Assigned to you" now shows project names instead of opaque task/application IDs. Organisation profile defaults to an editable draft and explains frozen records. | The console exposed raw API fields (`skip`, `take`, `task type`, `assignee id`, `unassigned`) and raw IDs, which is not usable reviewer UX and breaches the decision to hide API mechanics. Backend keeps evaluation tasks `pending` until all reviewer slots are filled, so active assignments are detected by assignee membership, not by status alone. | Verified live: claimed the seeded pool task, its detail and 4 accepted documents were readable through the proxy, and a real `PUT /api/applications/{id}/scorings/me` saved a draft score that round-tripped on reload. The test draft was later removed when the rubric was replaced (see #20). |
| 20 | 2026-11-23 | CEDA/BIA evaluator rubric | Replaced the three demo criteria (`Innovation potential`, `Market viability`, `Team capacity`) with the six CEDA/BIA categories: **Strategic Alignment**, **Innovation & Originality**, **Impact Potential**, **Feasibility & Viability**, **Scalability & Sustainability**, **Implementation Capacity**. Each has the specification description, `max_score=5.00`, equal `weight=1.00`, is required and active, and is ordered 1–6. The legacy criteria are deactivated, never deleted, because existing scores reference them with `on_delete=PROTECT`. A new idempotent backend command, `seed_ceda_rubric`, installs the canonical rubric and retires everything else. The workspace now offers labelled whole-number choices and the guidelines page shows the rating legend. | The evaluator workspace was still showing the old three-criterion demo rubric, so reviewers could not score the six assessed categories. The specification fixes 1 = Poor and 5 = Excellent; the middle labels (Fair, Satisfactory, Good) are the portal's plain-language guide, not invented scores. Criteria names and descriptions still come live from Django — the UI does not hardcode the rubric. | Live `GET /api/backend/api/scoring-criteria` returns exactly the six categories with their descriptions. The stale unconfirmed draft scoring that referenced the old criterion was deleted through the real scoring API, so the workspace starts clean. Backend rubric tests and the full Django suite pass; the rating legend and labelled 1–5 controls are deployed with the frontend. |
| 21 | 2026-11-23 | Purpose-built adjudicator + admin screens | Replaced the generic OpenAPI "Action" consoles on the adjudicator screens (decision queue, score comparison, decision entry, decision history) and the admin screens (reports & analytics, innovation repository, reviewer assignments, screening queue, adjudication overview). | The console exposed `skip`, `take`, `task type`, `application id`, `assignee id` and an "Action" dropdown — developer mechanics, not role UX. | Each screen now reads only live Django endpoints: adjudication tasks/scoring summary/scorings/adjudication confirm/scoped audit logs; reporting endpoints; applications/documents; task assignments and the new `/api/tasks/assignable` eligibility list; verification and clarification workflows. The adjudicator keeps the selected case in the browser session, not the URL, so opaque IDs are not displayed. Backend changes (scoped adjudicator audit access with `actor_username`, admin allowance on `wf/verify` and `wf/feedback`, assignable-employees endpoint) support these screens; only `admin/programmes` still uses the contract explorer. Full Django suite (158 tests) and `npm run build` pass. Live verification: two independent reviews were really confirmed through the scoring API, which moved the case to adjudication and assigned `adjudicator1@ceda.local`; the adjudicator then saw one task, both reviewer totals (22 and 21, weighted mean 3.58), the six-criterion rubric and only case-scoped audit entries with actor names, and saved a real draft decision (weighted 22). All nine replacement routes returned 200 from production. |
| 22 | 2026-11-23 | Read access for completed cases | An adjudicator with a **completed** case (`adjudicator@ceda.local`, application `ab4oug8oayxmgdbjvmnkzgqa`) got `404 Application not found` and the screen could not load. | Application detail and `assigned_to_me` only accepted task statuses `pending`/`assigned`, so reviewers lost read access the moment they confirmed a decision — breaking the comparison, decision and audit-history screens for exactly the cases they need to review. | Backend now also accepts `completed` assignments for assigned reviewers (owner and full-access admins unchanged). Added a regression test: 159 Django tests pass. Live after deploy: application detail, scoring summary, scorings, adjudication and audit endpoints all return 200 for that completed case. |

### Decision 8 detail — evaluator assignment (hybrid)

> **Superseded for evaluation tasks by decision #13:** evaluation tasks are no longer auto-assigned; they stay `PENDING` in the shared claim pool. Decline, conflict and claim-cap behaviour below still apply.

**Context.** The original `assign_task()` round-robins across active users in the `evaluator` group and ignores domain. Applications only have free-text `business_nature`/`project_title`; reviewers had no expertise field. A `Task` can already be `pending` (under-assigned) and scoring already records `no_conflict_declared`, which are useful primitives.

**Chosen flow.**

1. When an application reaches `evaluation`, infer a coarse sector from its text (energy, agriculture, fintech, health, logistics, manufacturing, ICT, general).
2. Rank available evaluators: those whose `expertise_sectors` include the sector first, then everyone else; use the existing round-robin cursor *within* each tier for fairness.
3. Auto-assign `evaluators_per_application` reviewers as today, so nothing sits unclaimed.
4. An assigned evaluator may **decline** (with a reason). Their assignment is deactivated and the task drops back to `pending` for refill.
5. Evaluators can browse a **pool** of `pending`/under-assigned evaluation tasks, filtered to their expertise, and **claim** a slot (subject to capacity and conflict rules).
6. Admin keeps manual assign/override via the existing endpoints.

**Rejected alternatives.** Pure queue (no expertise match) and pure self-select pool (unclaimed applications / cherry-picking).

**Resolved (see decision 9).** A decline releases the slot but does **not** create a `ConflictDeclaration`; declaring a formal conflict is a separate action so the two are not conflated. Claiming is capped only by the task's `evaluators_per_application` capacity — there is no per-reviewer quota yet (revisit if reviewers hoard work).

**Frontend.** The evaluator "Review queue" screen (`src/components/burnz/evaluator/`) shows auto-assigned work and the claim pool side by side. Pool rows are ranked by `expertise_match`, can be filtered to the reviewer's expertise, and expose a one-click "Claim for review" action; assigned rows expose "Open review workspace" and a reason-required "Decline assignment". API helpers live in `src/lib/api/client.ts` (`listTaskPool`, `claimTask`, `declineTask`, `setEvaluatorExpertise`) and pass through the existing `/api/backend/*` proxy (the `api/tasks` prefix was already allowed).

## Product overview

CEDA's innovation-management challenge calls for an online, ready-to-use system that functions as **both an innovation repository and a multi-level evaluation platform**. Burnz Nexus will provide an integrated user experience for innovators, independent evaluators and authorized institutional administrators.

The five outcomes described in the supplied challenge briefing are:

1. **Centralized repository:** secure, searchable innovation records and supporting evidence.
2. **Multi-level evaluation:** screening, independent assessments and adjudication under defined roles.
3. **Real-time tracking:** application, review and programme-progress visibility for authorized users.
4. **Feedback and iteration:** structured feedback, clarification and permitted resubmission.
5. **Reporting:** configurable metrics and evidence-based programme oversight.

The brief also emphasizes privacy, authentication, information access controls, safe file handling, secure hosting, dynamic validation and scoring, and secure notifications.

### Product principles

- **Simple for innovators:** plain-language instructions, draft saving, clear progress and action prompts.
- **Evidence-first for evaluators:** view proposals and documents beside scoring controls.
- **Operationally efficient for administrators:** queues, filters, assignments, audit trails and reports.
- **Secure by default:** private innovation records and minimum necessary access.
- **Backend-authoritative:** Next.js presents data but cannot authorize decisions or state transitions.
- **Modular:** reusable components and configurable programmes, forms and rubrics.

## Objectives and scope

### MVP / P0

- Shared authentication shell and role-aware navigation.
- Innovator registration, profile, application drafts and guided submission wizard.
- Evidence upload interface and completeness checks.
- Innovator application timeline and feedback / clarification responses.
- Admin screening queue, eligibility actions and reviewer assignment.
- Evaluator conflict declaration, assigned-case queue, six-category scoring and comments.
- Restricted adjudication and decision-recording workspace.
- Repository listing, application detail views and authorized document access.
- Dashboards and basic application / evaluation / turnaround reports.
- Accessible states for loading, empty results, permission denial and errors.

### Enhancements / P1

- Programme / form / rubric builders (backend-driven, not hard-coded per programme).
- Advanced search, configurable exports and portfolio analytics.
- Programme monitoring, milestones and outcome recording.
- Improved in-app notification centre and document previews.

### Future / P2

- Optional AI proposal-quality assistant with evidence-linked findings and human oversight.
- Similar-innovation discovery subject to access controls and IP safeguards.
- Approved institutional integrations, advanced analytics and optional financing workflows.

**Not in the default innovation MVP:** treating loan application fields (e.g., `loan_amount`) as mandatory for all innovators, automated AI approvals, public disclosure of confidential submissions or unrestricted reviewer access.

## Technology

| Layer | Selected technology | Responsibility |
| --- | --- | --- |
| Frontend | **Next.js** (App Router) + React + TypeScript | Pages, forms, navigation, client interactions |
| UI | **TailAdmin for Next.js**, Tailwind CSS | Design system, components, responsive layouts |
| Backend | **Django + Django Ninja** (separate repository) | Business logic, APIs, permissions, workflows |
| API contract | OpenAPI 3.1 from Django Ninja | Typed request/response definitions |
| Auth | Django session cookie + CSRF | Secure authenticated requests |
| Persistence | Backend-owned database | Application and evaluation records |
| Evidence files | Backend-controlled private storage | Upload, scan, authorize and download |

Use the installed TailAdmin template's dependencies and package manager as the starting point; do not replace its configuration without reviewing the existing project.

## Architecture

```text
                         USERS
              Innovator / Evaluator / Admin
                            |
                            v
                 Next.js + TailAdmin
                (BURNS-NEXUS/ceda-frontend)
              Pages / Forms / Dashboards / UX
                            |
               Typed HTTPS API requests
              Session cookie + CSRF header
                            |
                            v
                   Django Ninja API
                     (ceda-backend)
         Auth / RBAC / State Machine / Evaluation
             Files / Audit / Notifications
                     /           \
                    v             v
             Database       Private File Store
```

**Ownership boundary:** The backend alone decides which users may read or modify records, whether state transitions are valid, when reviews become visible, how scores are persisted, and when applicant-visible feedback is released. Frontend guards are convenience features, never the only enforcement layer.

## User roles and portals

### Innovator — `/innovator`

**Goal:** understand eligibility, submit a strong application and know what happens next.

- Browse eligible programmes and deadlines.
- Create drafts and complete guided application sections.
- Upload evidence, verify completeness and submit.
- Track application status and review the event timeline.
- Receive clarification requests and approved feedback.
- Submit new versions when revision is authorized.

### Evaluator — `/evaluator`

**Goal:** assess assigned proposals impartially and efficiently.

- Review assigned cases and due dates.
- Complete conflict-of-interest declaration **before** access to the assigned evidence.
- Read proposal sections and approved documents.
- Enter six criterion scores (1–5) and criterion-level comments.
- Save review drafts and submit a completed assessment.
- Keep independent reviewer drafts and scores hidden from peer evaluators.

### Administrator — `/admin`

**Goal:** manage intake, governance, review allocation, programme operations and reporting.

- Monitor intake and screening queues.
- Check completeness and eligibility, request clarification, record outcomes.
- Assign qualified evaluators, avoid / resolve conflicts and oversee progress.
- Manage programmes, documents, users, roles and audit views.
- Operate repository and reporting tools.

**Adjudicator / committee:** a permission-restricted workspace under `/admin/adjudication` (or a dedicated route if agreed). It compares completed reviews and records authorized decisions and reasons. Being an administrator should **not automatically** imply adjudication permission.

## Screen inventory

| Area | Key screens |
| --- | --- |
| Shared | Sign in, registration, session/error pages, account settings, notifications |
| Innovator | Dashboard, programmes, eligibility, my applications, application wizard, document manager, submission confirmation, timeline, clarification response, feedback, revision history |
| Evaluator | Dashboard, assigned reviews, conflict declaration, proposal / evidence viewer, rubric scoring, review draft, submitted review confirmation |
| Admin | Overview, application registry, screening queue, document verification, reviewer assignments, evaluation monitoring, adjudication, decisions, applicant feedback, repository, reports, user / programme settings, audit history |

**Navigation:** use TailAdmin's common visual language with distinct sidebar content for each role. Provide breadcrumbs, status chips, actionable empty states and predictable return paths.

## Application and review lifecycle

**Proposed implementation state machine** — final transitions and exceptions require programme-owner confirmation:

```text
Draft
  | submit
  v
Submitted --> Administrative Screening
                  |          |             |
             Clarification  Ineligible    Eligible
                  |          |             |
            Applicant reply Archive    Assign Reviewers
                  |                        |
              Re-screen               Independent Reviews
                                           |
                                    Review Submissions
                                           |
                                      Adjudication
                                           |
                                      Decision Record
                                           |
                                  Release Approved Feedback
                                           |
                               Revise / Monitor / Archive
```

### Event-to-API ownership

| User action | Frontend behavior | Django responsibility |
| --- | --- | --- |
| Create application | Open wizard and show saved draft | Create record and stable ID |
| Save section | Autosave, show last-saved time | Validate draft fields and persist |
| Upload evidence | Show progress and scan state | Validate, scan and privately store file |
| Submit | Show checks and confirmation | Validate completeness, freeze version, transition state, audit |
| Screen | Display queue and action form | Authorize and persist outcome / reason |
| Assign reviewer | Show reviewer picker | Check eligibility, conflicts, duplicates and permissions |
| Submit review | Show validation and confirmation | Validate six scores, lock submission, audit |
| Adjudicate | Compare approved completed reviews | Enforce authority, preserve rationale and decision |
| Release feedback | Show applicant-ready message | Separate public feedback from private reviewer notes |
| Resubmit | Open permitted revision form | Create new version; preserve previous snapshot |
| View dashboard | Display counts, charts and lists | Return permission-scoped aggregate data |

Keep **workflow state**, **decision outcome**, **review status** and **notification delivery status** distinct; a failed email should not silently alter an application's state.

## Application form sections

The guided innovator wizard should capture the information reviewers need, with programme-configurable required fields and validation.

| Step | Section | Core fields |
| --- | --- | --- |
| 1 | Applicant / organization | Names, email, phone, organization details, ownership declarations where applicable |
| 2 | Project basics | Title, short summary, sector, development stage, location |
| 3 | Problem & strategic alignment | Problem statement, affected users, relevance to CEDA mission / Vision 2036 |
| 4 | Innovation & originality | Proposed solution, novelty, alternatives, technology, differentiation |
| 5 | Impact potential | Expected beneficiaries, jobs, inclusion, environmental outcomes, metrics |
| 6 | Feasibility & viability | Technical approach, prototype status, resources, costs, risks and mitigation |
| 7 | Scalability & sustainability | Target market, growth strategy, operational and financial sustainability |
| 8 | Implementation capacity | Team, skills, governance, partners, milestones and delivery plan |
| 9 | Supporting evidence | Documents, prototype demonstrations, research, validation and descriptions |
| 10 | Review & submit | Completeness summary, declarations, privacy / IP acknowledgements, submit action |

These are **proposed UI sections informed by the supplied brief**, not a verbatim official CEDA application form. The backend should define which fields are required per programme. Drafts may be incomplete; **submitted versions must be immutable**.

## Evaluation rubric

The supplied CEDA/Botswana Innovation Agency briefing explicitly provides six evaluation categories and a **1–5 scale** (`1 = Poor`, `5 = Excellent`), with space for comments:

1. **Strategic Alignment:** supports CEDA's mission and Botswana Vision 2036.
2. **Innovation & Originality:** significant improvement or new concept using emerging technology.
3. **Impact Potential:** employment, youth/women empowerment and environmental sustainability.
4. **Feasibility & Viability:** technical soundness and availability of resources.
5. **Scalability & Sustainability:** replicability, financial sustainability and growth plans.
6. **Implementation Capacity:** team capability, governance, experience and leadership.

Each criterion needs a score, comment, visible scoring guidance and relevant evidence references. Reviewers can save privately, then explicitly submit. Submitted assessments should be locked or amended through an audited process.

**Not confirmed by the brief:** category weights, total-score formula, pass threshold, number of reviewers, quorum and tie-breaking. Do **not** hard-code these as official rules; use programme configuration and obtain approval.

## Frontend UX standards

- **Visual:** clean institutional SaaS design, restrained colors, light default theme with accessible dark-mode support if provided by TailAdmin.
- **Innovator:** mobile-first wizard, friendly copy, progress indicator, save-and-return, obvious next step.
- **Evaluator:** desktop-optimized evidence viewer beside scoring pane; responsive tabs on smaller devices.
- **Admin:** searchable / filterable tables, bulk actions only where permissions allow, clear audit history.
- **Forms:** labels, help text, required indicators, character limits, inline validation, focus management and accessible errors.
- **Statuses:** use both text and color; never rely solely on color.
- **Async behavior:** display loading, retry, upload scanning, unsaved changes and session-expired states.
- **Accessibility:** keyboard controls, semantic form labels, contrast and screen-reader announcements.
- **Design consistency:** reuse TailAdmin controls and shared application, status, document and evaluation components.

## Getting started

### Prerequisites

- Git and a supported Node.js LTS runtime.
- A package manager matching the TailAdmin starter's lockfile (`npm`, `pnpm`, or `yarn`).
- Access to the private frontend repository and the TailAdmin Next.js template / valid license as applicable.
- Running Django Ninja backend (local or staging) for integration testing.

### Clone and install

```bash
git clone https://github.com/BURNS-NEXUS/ceda-frontend.git
cd ceda-frontend
```

**If the repository has only this README:** first add the official **TailAdmin Next.js** starter in this repository and commit it. Do not run `npm install` until `package.json` exists.

**If the TailAdmin starter has been committed:**

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, copy the environment file using:

```powershell
Copy-Item .env.example .env.local
```

Then open `http://localhost:3000` (or the URL printed by Next.js). If the starter uses another package manager, use its documented equivalent. Consult `package.json` for the actual available scripts; do not assume every script below exists before it has been configured.

### Suggested package scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

These are **suggested scripts**, not a replacement for TailAdmin's actual `package.json`. Install and configure Vitest / Playwright before adding their scripts.

## Environment variables

Add an `.env.example` (safe to commit) with documented placeholders:

```dotenv
# Server-only: Django origin used by the /api/backend proxy (never exposed to browsers)
BACKEND_API_ORIGIN=http://127.0.0.1:8000

# Display / branding
NEXT_PUBLIC_APP_NAME=Burnz Nexus Innovation Portal
NEXT_PUBLIC_APP_ENV=development
```

Vercel deployments set `BACKEND_API_ORIGIN` in `vercel.json`. Change the value there (or override it in the Vercel project settings) when the Django host changes; the local proxy falls back to the default origin when the variable is unset.

**Never commit** `.env.local`, login credentials, API secrets, production session cookies or applicant data. `NEXT_PUBLIC_` values are visible to browsers and must not contain secrets.

## Suggested project structure

Adapt to TailAdmin's existing folders; do not rewrite its template structure unnecessarily.

```text
ceda-frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── innovator/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── applications/page.tsx
│   │   │   └── applications/[id]/page.tsx
│   │   ├── evaluator/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── reviews/[id]/page.tsx
│   │   ├── admin/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── screening/page.tsx
│   │   │   ├── adjudication/page.tsx
│   │   │   └── reports/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── applications/
│   │   ├── evaluations/
│   │   ├── documents/
│   │   └── shared/
│   ├── features/
│   │   ├── auth/
│   │   ├── applications/
│   │   ├── screening/
│   │   ├── reviews/
│   │   ├── decisions/
│   │   ├── repository/
│   │   └── reports/
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   └── validation/
│   └── types/
├── tests/
├── .env.example
├── README.md
└── package.json
```

## Backend integration

### Current API contracts verified in the supplied Django Ninja OpenAPI

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Health |
| GET | `/api/auth/csrf` | Issue CSRF cookie |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Session user |
| GET, POST | `/api/applications/` | List / create |
| GET, PATCH, DELETE | `/api/applications/{application_id}` | Retrieve / edit / delete |
| POST | `/api/applications/{application_id}/wf/submit` | Submit |
| POST | `/api/applications/{application_id}/wf/resubmit` | Resubmit |
| POST | `/api/applications/{application_id}/wf/feedback` | Existing feedback workflow action; confirm semantics |
| GET | `/api/clarifications/` | List clarifications |
| GET | `/api/audit-logs/` | List audit logs |

**API integration rules:**

- Preserve trailing slashes where defined (`/api/applications/`).
- The existing API uses a `sessionid` cookie and `X-CSRFToken` header for state-changing requests.
- `UserOut` currently has name / email / ID but **does not expose roles or permissions**; add a reliable permissions contract before implementing protected navigation.
- Existing `ApplicationIn` requires `loan_amount` and finance-oriented organization data; this is **not sufficient** for the innovation wizard and should become programme-aware.
- `ApplicationOut.id` is a string while `ClarificationOut.application_id` is an integer; backend should reconcile identifier types.
- There is a typo in the schema name `FeebackAplicationIn`; coordinate any rename as a contract change.
- Do not infer API support from a frontend mockup. Display demo data explicitly as mock data until an endpoint is implemented.

### Proposed endpoints — not present in the provided OpenAPI

The following are **requests to the backend team**, not routes guaranteed to work:

```text
GET    /api/programmes/
GET    /api/programmes/{id}/form-schema
GET    /api/me/permissions
GET    /api/applications/{id}/timeline
GET    /api/applications/{id}/completeness
POST   /api/applications/{id}/documents
GET    /api/applications/{id}/documents
GET    /api/documents/{id}/download
POST   /api/applications/{id}/screening
POST   /api/clarifications/{id}/respond
POST   /api/applications/{id}/reviewer-assignments
GET    /api/reviews/assigned
POST   /api/reviewer-assignments/{id}/conflict-declaration
GET    /api/reviews/{id}
PATCH  /api/reviews/{id}
POST   /api/reviews/{id}/submit
GET    /api/applications/{id}/adjudication
POST   /api/applications/{id}/decisions
POST   /api/applications/{id}/feedback/release
GET    /api/applications/{id}/feedback
GET    /api/repository/innovations
GET    /api/reports/overview
GET    /api/notifications/
```

For every API, frontend and backend developers must agree on request and response schemas, permissions, validation errors, legal states, audit events and expected status codes. Prefer generating TypeScript types from the authoritative OpenAPI schema.

### Recommended standardized API errors

- `401` authentication required / expired session.
- `403` authenticated but not permitted.
- `404` missing or non-disclosable resource.
- `409` invalid workflow transition or concurrent update.
- `400` or `422` form validation errors, with field-name keys; pick and document one convention.

Use stable machine-readable error codes; don't parse English text to infer states.

## Authentication and security

The supplied briefing places substantial emphasis on confidentiality and IP protection. Implement security jointly with the Django team.

1. Prefer a **same-origin proxy / Next.js BFF** or carefully configured cross-origin session strategy. Agree on cookie domains, `Secure`, `HttpOnly`, `SameSite`, CSRF trusted origins and deployment domains.
2. Fetch Django's CSRF cookie before unsafe requests and send `X-CSRFToken` correctly, without exposing sessions to browser storage.
3. Never save session tokens or passwords in `localStorage`; never expose privileged tokens through `NEXT_PUBLIC_` variables.
4. Enforce RBAC **and per-application object authorization on the backend**; front-end route guards do not protect data.
5. Evaluators must not access peer review drafts, unassigned applications or conflict-blocked evidence.
6. Only backend-authorized endpoints may return private files; do not use public storage links for submissions.
7. Show file validation / malware scanning states; never mark an upload ready just because transfer completed.
8. Do not display confidential reviewer notes in applicant-visible feedback.
9. Audit submission, viewing of sensitive evidence (as policy requires), scoring, decisions, version changes and permissions changes.
10. Treat AI-derived suggestions as optional assistance, never as authorized acceptance decisions.
11. Ensure appropriate consent, privacy, retention and IP acknowledgements; legal terms require institutional approval.
12. Avoid logging sensitive application contents and full document payloads to the browser console, analytics or error trackers.

### Reviewer independence

A reviewer completes the conflict declaration before being granted evidence access; saves private scoring drafts; and submits all required criteria. Independent reviewer comments and scores remain hidden from peer evaluators until the programme's policy explicitly permits disclosure. An adjudicator sees completed reviews only where authorized.

## Frontend data and state management

- **Server state:** fetch data from Django; use a consistent typed API layer and a query/cache approach compatible with TailAdmin.
- **Wizard state:** separate unsaved edits from successfully persisted draft data; debounce autosave, show errors and avoid silent data loss.
- **Workflow state:** derive from backend responses, not client-side status toggles.
- **Uploads:** handle interrupted uploads, scanning, retries and invalid formats.
- **Optimistic UI:** only for reversible presentation actions; do not optimistically finalize assessments or decisions.
- **Accessibility:** on validation error, focus the summary / first invalid input and preserve user-entered text.
- **Mock mode:** label clearly and keep realistic fixtures separate from real API integration code.

## Testing and quality

### Frontend quality gates

- Type checking and linting pass.
- Responsive checks across narrow mobile, tablet and desktop layouts.
- Keyboard navigation, input labels, form error announcements and readable contrast.
- Empty, loading, error, permission denied, session expired and slow network states.
- Component tests for form sections, score controls, status badges and permissions-aware navigation.
- End-to-end workflow against a seeded backend: draft → submit → screen → assign → independent reviews → adjudicate → feedback → permitted revision.

### Security / integration acceptance tests

- Innovator cannot fetch a different innovator's application or evidence.
- Evaluator cannot see unassigned cases or peers' unsubmitted scores.
- Conflict declaration blocks review access appropriately.
- All six scores must be integers from 1 to 5; server validates values and required comments according to policy.
- Invalid transitions return a stable error and do not corrupt the application.
- Submission versions cannot be silently overwritten.
- Uploaded evidence cannot be downloaded before authorized clearance.
- Reports respect user scopes and never reveal restricted records.

## Delivery roadmap

| Phase | Frontend deliverable | Backend dependency |
| --- | --- | --- |
| 0. Foundation | TailAdmin setup, design tokens, layouts, route shells | Auth / permissions response agreed |
| 1. Innovator | Profile, programme list, wizard, uploads, timeline | Programme schemas, draft / file / workflow APIs |
| 2. Evaluator | Queue, conflict declaration, evidence viewer, six-category rubric | Assignments, reviews, rubric versions, access controls |
| 3. Admin | Screening, assignments, adjudication and feedback release | Screening / decision APIs and audit events |
| 4. Repository & reports | Search, detailed records, status / trend dashboards | Query, repository and aggregate endpoints |
| 5. Hardening | Accessibility, E2E tests, security review, demo data | Stable staging APIs, seeded accounts and deployment |

Use a realistic scenario with **one innovator, two independent reviewers and one authorized adjudicator** for the demonstration. The brief calls for multi-level evaluation but does not prescribe exactly two reviewers: that is a proposed demo configuration.

## Contribution and collaboration

### Branch strategy

- `main`: reviewed stable code.
- `develop` (optional): integration branch if the team agrees.
- `feature/<area>-<description>`: scoped implementation work.
- `fix/<area>-<description>`: bug fixes.

### Pull requests

1. Reference the screen or product requirement.
2. Include UI screenshots (desktop and mobile) for visible changes.
3. State which API routes are integrated, mocked or awaiting the backend.
4. Include validation and error-state behavior.
5. Run lint, typecheck and relevant tests.
6. Have a second team member review changes before merging.

### Frontend / backend contract change process

- Backend publishes an updated OpenAPI definition.
- Frontend regenerates types, reviews breaking changes and updates API adapters.
- Both teams test permissions, validation, success and error paths.
- Breaking changes must be agreed before deployment; do not silently rename fields.

### Suggested issue labels

`frontend`, `backend-contract`, `ux`, `security`, `bug`, `p0`, `p1`, `blocked`, `needs-review`.

## Acceptance checklist

- [ ] Three role-specific TailAdmin workspaces are navigable and responsive.
- [ ] Users can authenticate and obtain server-backed permissions.
- [ ] Innovator can create, autosave, complete and submit an application.
- [ ] Evidence is uploaded through private, validated backend workflows.
- [ ] Innovator can see backend-driven status and permitted feedback.
- [ ] Admin can screen and assign evaluators.
- [ ] Independent evaluators can score all six categories from 1 to 5 and provide comments.
- [ ] Adjudicator can review completed assessments and record a reasoned decision.
- [ ] Feedback release and revision permissions are enforced by Django.
- [ ] Repository and reporting use real, permission-scoped backend records.
- [ ] Audit trails capture sensitive workflow actions.
- [ ] End-to-end and negative authorization tests pass.
- [ ] Deployment secrets, backups, security and accessibility checks are completed.

## References and ownership

**Requirements basis:**

- CEDA / Botswana Innovation Agency briefing slides supplied to the project team: *Expected Outcomes*, *Evaluation Form — Key Categories* and *Safeguarding Innovation & Client Information*.
- Burnz Nexus *Integrated Innovation Management Platform — Technical Proposal*, dated 12 November 2026.
- Project-specific frontend form specification and Next.js / Django Ninja integration handoff.
- Existing Django Ninja OpenAPI document supplied by the backend team.

**Frontend repository:** `BURNS-NEXUS/ceda-frontend`  
**Backend:** separate Django + Django Ninja project (repository name / URL to be confirmed).  
**Maintainer:** Burnz Nexus project team.  
**License:** Proprietary / private project; no open-source license granted unless the repository owner explicitly adds one.

> **Important:** This project is an independent prototype developed in response to a CEDA-related innovation-management brief. Repository documentation must not imply official CEDA endorsement, deployment or authorization to access CEDA production systems.


If you find this project helpful, please consider giving it a star on GitHub. Your support helps us continue developing and maintaining this template.
