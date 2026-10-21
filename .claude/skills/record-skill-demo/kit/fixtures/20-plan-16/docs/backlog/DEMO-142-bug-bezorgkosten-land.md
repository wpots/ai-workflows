# Bug: Bezorgkosten verdwijnen na wisselen van land

## Status

In progress. Toegevoegd aan Sprint 16 op 9 oktober.

## Ticket

DEMO-142

## Priority

high

## Summary

Wie in de checkout van Nederland naar België wisselt, ziet de bezorgkosten
verdwijnen en betaalt € 6,95 te weinig.

## Reproduction

1. Voeg een product toe en ga naar de checkout
2. Kies als land België
3. De regel "Bezorgkosten" is weg; het totaal is € 6,95 te laag

## Acceptance Criteria

- Bij België blijven de bezorgkosten (€ 6,95) zichtbaar en tellen ze mee
- Terugwisselen naar Nederland toont weer € 4,95

## Technical Notes

- `src/modules/checkout/shippingCost.ts` kent alleen `"NL"`
