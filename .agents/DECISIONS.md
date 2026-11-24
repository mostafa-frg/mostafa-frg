# Architecture and Governance Decisions

## DEC-001 — GitHub is the shared source of truth
**Decision:** Code, branches, PRs, commits, and coordination records live in GitHub.
**Reason:** Agents do not share a reliable live conversation memory; commit-addressed records provide durable handoff.

## DEC-002 — Human-controlled release authority
**Decision:** Agents may prepare branches and PRs, but must not merge or deploy Production without explicit human approval for that exact action.
**Reason:** Prevent accidental or unauthorized release.

## DEC-003 — One writer per path
**Decision:** Parallel agents may work only on non-overlapping paths or isolated branches with an explicit integration owner.
**Reason:** Avoid lost updates and conflicting commits.

## DEC-004 — Evidence-based status
**Decision:** Every claim is tied to an exact commit SHA, test command, CI run, or source evidence. Unknown is not PASS.
**Reason:** Avoid false confidence and stale status.

## DEC-005 — Coordination work is isolated from application changes
**Decision:** The coordination foundation is maintained on its own branch and PR, separate from application implementation. PR #5 was merged after the initial coordination snapshot; the earlier statement that it must remain open is historical and no longer describes live repository state.
**Reason:** Keep orchestration scaffolding separate from application changes while keeping status records aligned with GitHub.

## DEC-006 — Security review is independent
**Decision:** The implementer cannot self-approve security-sensitive work. High/Critical findings block release until fixed and retested.
**Reason:** Separate implementation from assurance.
