# Feature: Checkout-overzicht met btw per regel

## Status

Planned for Sprint 16.

## Ticket

DEMO-130

## Priority

high

## Summary

Het checkout-overzicht toont per regel product, aantal, prijs en btw-tarief,
met totalen exclusief en inclusief btw.

## User Story

Als klant wil ik in de checkout per regel zien wat ik betaal, zodat ik zonder
verrassingen afreken.

## Acceptance Criteria

- Per regel: product, aantal, prijs en btw-tarief (9% of 21%)
- Totaal exclusief btw, het btw-bedrag en het totaal inclusief btw
- Alle bedragen in Nederlandse notatie

## Technical Notes

- Rekenen in `src/modules/checkout/calculateTotals.ts`, in centen, met tests
- Weergave in `src/modules/checkout/CheckoutSummary.tsx`
- Prijzen via `formatPrice` (DEMO-131)

## Related

- Depends on: DEMO-131-feat-prijzen-nl-notatie.md
