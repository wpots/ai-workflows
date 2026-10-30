# Ready Check — Reference

The procedure behind the "Ready check" section of `skills/backlog`. It holds an
item against the Definition of Ready in `rules/backlog.md`, gives every open
point a next step, and leaves the flip to `ready` to the developer. That flip is
the gate after which `skills/work-backlog` may build the item unattended, so the
check proposes and never decides.

## Which items

- The items `skills/backlog` just wrote or updated (Workflow step 12).
- One item the user names, by file name or ticket key.
- A set the user names: a sprint's items, every `draft` item, the slices of one
  ticket. `skills/sprint-planning` offers the sprint's planned items after its
  review pause.

Items that are already `in-progress` or `done` are skipped; the report says so.

## Per item

A status that still reads `Planned for Sprint <N>.` — sprint-planning wrote it
as the value before it kept the value — is `draft` with that line as a note.

1. Read the item, the items it `Depends on:`, and the code paths its
   `Technical Notes` name. Ground it the way Workflow step 4 does: against the
   tree it will be built on, not the tree it was written against.
2. Hold it against every point of the Definition of Ready. Size and
   contradicting criteria use the checks of Workflow steps 9 and 10 — run them,
   do not restate them.
3. A point that does not apply passes (no UI, no external dependency). A point
   that cannot be judged from the item and the tree is a question for the
   developer, not a fail.

## Product questions go to the developer first

The developer often knows the answer, and the right channel differs per
question. Put every open product question to the developer **one at a time**,
with four options, and write the route they choose into the item:

| Route | Written into the item |
| --- | --- |
| Answer it now | the answer, folded into the criterion or `Technical Notes` |
| Ask the PO | `Blocked on: PO — <question>`; offer to draft the message, which the developer sends |
| Keep it for the next refinement | `Blocked on: refinement — <question>` |
| Record it as an assumption | `Assumption: <statement>` in `Technical Notes`; it does not block |

This skill never writes to the tracker (see "Scope" in `SKILL.md`): a drafted
message is for the developer to send.

## Every other open point

| Open point | Next step |
| --- | --- |
| Too big | cut it into slices (Workflow step 9) |
| Criteria that cannot all hold | fix it when the intent is clear, otherwise a question to the developer (Workflow step 10) |
| Approach unclear — two viable approaches with a real trade-off | the developer chooses; record the choice and why in `Technical Notes`, and a durable one as an ADR (`rules/adr.md`) |
| Knowledge missing — an unknown API, library or data shape | a `spike-` item with a timebox whose outcome is a decision; this item `Depends on:` it |
| Design missing or incomplete | back to design; the item stays `draft` |
| External dependency missing — credentials, API access, client content | request it from whoever owns it |
| Bug without a reproduction | reproduce it first (Workflow step 6) |

The approach route is the only place where something plan-like gets written. An
item whose approach is already clear needs no separate plan.

## Writing the result

- **Not ready:** under the status value, one `Blocked on: <who> — <what>` line
  per open point and one `Next step: <action> (<who>)` line for what comes
  first. A later check replaces these lines; it does not add to them.
- **Ready:** propose it. Write `ready` only after the developer confirms that
  item. "Yes, all three" for a listed set confirms the items listed; silence, or
  a reaction to the report as a whole, does not. Remove the `Blocked on:` and
  `Next step:` lines when you flip, and keep any other note.
- **Legacy status:** writing the status of an item that reads
  `Planned for Sprint <N>.` puts the value on the first line and keeps
  `Planned for Sprint <N>.` below it as a note.
- Outside `## Status`, the check only writes what the developer decided: a
  folded-in answer, an assumption, an approach choice. Anything else is a
  proposal in the report.

## Report

One table, then the proposal:

| Item | Verdict | Open points | Next step |
| --- | --- | --- | --- |
| `OBA-150-feat-share-vacancy.md` | not ready | PO question on expired vacancies | developer asks the PO |
| `OBA-151-feat-vacancy-alert.md` | ready | — | confirm to flip |

"Ready to flip: `OBA-151-feat-vacancy-alert.md`. Confirm?"
