# Bug: Afbeeldingen zonder alt-tekst op de categoriepagina

## Status

Planned for Sprint 16.

## Ticket

DEMO-133

## Priority

high

## Summary

Productafbeeldingen op `/categorie/*` hebben geen alt-tekst; schermlezers lezen
de bestandsnaam voor.

## Reproduction

1. Open `/categorie/keuken` met VoiceOver aan
2. Tab naar de eerste productkaart
3. VoiceOver leest "pan-24cm-final-v2.jpg, afbeelding"

## Acceptance Criteria

- Elke productafbeelding heeft de productnaam als alt-tekst
- Decoratieve afbeeldingen hebben een lege alt

## Technical Notes

- `src/modules/category/ProductGrid.tsx`
