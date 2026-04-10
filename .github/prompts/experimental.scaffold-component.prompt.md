---
name: scaffold-component
description: "Scaffold Component"
---

# Scaffold Component

Create a new React component following the project structure and conventions.

## Inputs Required

Ask the user for:

1. **Component name** (PascalCase, e.g. `UserCard`)
2. **Location**: `components/ui/` or `components/features/` or a custom path
3. **Files to generate** (ask if not specified):
   - `[Name].tsx` — always
   - `index.ts` — always
   - `[Name].test.tsx` — optional (default: yes)
   - `[Name].stories.tsx` — optional (default: yes)

## File Templates

### `[Name].tsx`

```tsx
interface [Name]Props {
  // define props here
}

export function [Name]({ }: [Name]Props) {
  return (
    <div>
      {/* [Name] */}
    </div>
  );
}
```

### `index.ts`

```ts
export type { [Name]Props } from "./[Name].tsx";
export { [Name] } from "./[Name].tsx";
```

### `[Name].test.tsx`

```tsx
import { render } from "@testing-library/react";
import { [Name] } from "./[Name].tsx";

describe("[Name]", () => {
  it("renders without crashing", () => {
    const { container } = render(<[Name] />);
    expect(container).toBeTruthy();
  });
});
```

### `[Name].stories.tsx`

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { [Name] } from "./[Name].tsx";

const meta: Meta<typeof [Name]> = {
  title: "Components/[Name]",
  component: [Name],
};

export default meta;

type Story = StoryObj<typeof [Name]>;

export const Default: Story = {};
```

## Rules

- Always use `function` keyword, never arrow function for the component export.
- Props interface goes in `index.ts`, not in the component file.
- Use `@/` path aliases in all imports — never relative paths.
- No `React.FC` or `React.memo` unless justified.
- Component must stay under 200 lines.

## Output

List the files created with their full paths. Do not add placeholder comments beyond the template above.
