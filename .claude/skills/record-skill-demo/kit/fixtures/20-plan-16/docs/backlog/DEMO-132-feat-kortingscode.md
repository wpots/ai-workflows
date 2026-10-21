# Feature: Kortingscode invoeren in de winkelwagen

## Status

Planned for Sprint 16.

## Ticket

DEMO-132

## Priority

high

## Summary

Klanten voeren een kortingscode in de winkelwagen in. Een geldige code komt
als aparte regel in het overzicht.

## User Story

Als klant wil ik een kortingscode invoeren in de winkelwagen, zodat ik de
korting direct zie.

## Acceptance Criteria

- Geldige code: de korting staat als aparte regel in het overzicht
- Ongeldige of verlopen code: een foutmelding die ook een schermlezer voorleest
- Eén code per bestelling
- Een vast bedrag maakt het totaal nooit negatief

## Technical Notes

- Codes valideren via de kortingen-API (`src/lib/discounts/`), sleutel uit
  `DISCOUNT_API_KEY` in de omgeving
- Rekenen in `src/modules/cart/applyDiscountCode.ts`, in hele centen
- Formulier in `src/modules/cart/DiscountCodeForm.tsx`
- Route handler `POST /api/discount`, input valideren met Zod

## Related

- Depends on: DEMO-130-feat-checkout-overzicht.md
