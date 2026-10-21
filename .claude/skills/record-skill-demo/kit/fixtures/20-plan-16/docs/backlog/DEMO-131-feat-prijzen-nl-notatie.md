# Feature: Prijzen in Nederlandse notatie

## Status

Planned for Sprint 16.

## Ticket

DEMO-131

## Priority

medium

## Summary

Prijzen tonen als € 12,50 en € 1.234,56 in plaats van €12.50.

## Acceptance Criteria

- Komma als decimaalteken, punt als duizendtalscheiding
- Overal waar `formatPrice` gebruikt wordt

## Technical Notes

- `src/utils/formatPrice.ts`: `Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" })`
- Let op: Intl zet een non-breaking space na het euroteken
