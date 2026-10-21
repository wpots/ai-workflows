# Feature: Productpagina toont voorraadstatus

## Status

Delivered in Sprint 15.

## Ticket

DEMO-120

## Priority

medium

## Summary

De productpagina toont of een product op voorraad, bijna uitverkocht of
uitverkocht is.

## Acceptance Criteria

- Op voorraad bij 5 of meer, bijna uitverkocht onder 5, uitverkocht bij 0
- Uitverkocht: de knop "In winkelwagen" is uitgeschakeld

## Technical Notes

- `src/modules/product/getStockStatus.ts` met tests
- `src/modules/product/StockBadge.tsx`

## Authors

- Wieteke Pots <wieteke.pots@greenberry.nl>
