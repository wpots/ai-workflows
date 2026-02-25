# Accessibility Rules

## Must Implement

- Use semantic HTML (nav, main, article, section, header, footer, etc.)
- Include proper ARIA labels for icon-only buttons and ambiguous controls
- Ensure full keyboard navigation (tab order, Enter/Space handlers)
- Maintain color contrast ratios — WCAG AA minimum
- Form labels must use `htmlFor` attribute linked to input `id`
- Include `alt` text for all images; use `alt=""` for decorative images
- Support screen readers with proper ARIA attributes (`role`, `aria-*`)
- Manage focus order and visibility effectively
- Follow a logical heading hierarchy (h1 → h2 → h3, no skipping)
- Provide clear, accessible error feedback on form fields

## Component Checklist

When building interactive components:

- [ ] Keyboard operable (Tab to reach, Enter/Space to activate)
- [ ] Focus visible (not hidden by `outline: none` without replacement)
- [ ] ARIA role and state reflect current UI state (`aria-expanded`, `aria-selected`, etc.)
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Color is not the only means of conveying information

## Testing

- Use Storybook a11y addon to catch violations in the browser
- Verify with keyboard-only navigation in every interactive story
- Test with a screen reader for complex components (modals, comboboxes)
