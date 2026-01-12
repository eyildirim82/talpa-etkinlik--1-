# Design & CSS Architecture Audit Report

## 🎨 Design & UX Findings
The application demonstrates a strong foundational setup but suffers from **implementation inconsistency** that undermines the premium feel.

*   **Inconsistent Visual Language**: While a semantic design system exists, the UI oscillates between "System" (tokens like `text-text-primary`) and "Ad-Hoc" (raw values like `text-gray-700`). This creates subtle visual jarring where greys don't match and focus states vary.
*   **Micro-Interactions**: The use of `animate-in` and shared layout transitions (e.g., in `AuthModal`) is excellent and adds a premium feel. However, these are applied manually rather than through a centralized motion system.
*   **Input Field Fragmentation**: Form inputs are re-styled in individual components (e.g., `AuthModal`) rather than imported from a central `Input` component. This leads to drift—some inputs have `border-gray-300`, others might use `border-ui-border`.

## 🧱 CSS Architecture Assessment
**Current State**: TailwindCSS v4 with a custom Design Token abstraction (`src/shared/design-tokens`).

*   ✅ **Strong Foundation**: The `tailwind.config.ts` is remarkably well-structured, mapping semantic tokens (`brand`, `ui`, `state`) to Tailwind classes. This is production-grade architecture.
*   ❌ **Leaky Abstraction**: Developers are bypassing the tokens. In `AuthModal.tsx`, we see mixed usage:
    *   Good: `bg-ui-background text-text-primary`
    *   Bad: `bg-gray-50 border-gray-300 text-gray-900`
    *   This defeats the purpose of the design system and makes theming (e.g., Dark Mode) difficult/impossible in the future.
*   ❌ **Specificity & Z-Index Wars**: Arbitrary values like `z-[9999]` in modals indicate a lack of a managed z-index scale (or "Elevation" system) for layering.

## 📐 Design System Recommendations
The system is 80% there technically, but usage is only 50%.

1.  **Strict Token Enforcement**:
    *   **Action**: Configure Stylelint or a custom ESLint rule to **forbid** usage of raw Tailwind colors (`gray-*`, `blue-*`) in feature components. Only allow semantic tokens (`text-primary`, `bg-brand`, etc.).
2.  **Centralize Form Primitives**:
    *   **Action**: Create `Input`, `Label`, and `FormGroup` components in `src/components/common` (or `ui`). Stop copying the 12-line `className` string for inputs.
3.  **Elevation Scale**:
    *   **Action**: Define `z-index` tokens in Tailwind config (e.g., `z-modal`, `z-overlay`, `z-toast`) to replace magic numbers.

## 🧩 Component Strategy Advice
*   **Refactor `AuthModal`**: It currently contains a large `form` with manual input styling.
    *   Extract `AuthLayout` or `FormCard` for the container (shadows, animations).
    *   Extract `FormInput` for the consistently styled fields.
*   **Audit `Button` Usage**: The `Button` component is solid. Ensure all "clickable" elements use it instead of `div` or raw `button` tags to maintain focus state consistency.
*   **Consolidate Icons**: There is technical debt with `.material-symbols-outlined` in `index.css` vs `lucide-react` in components. Standardize on **Lucide** for consistency and remove the Google Fonts dependency if possible.

## 🧠 Strategic Design Direction
**"Premium Systemic"**

We do not need a visual redesign; we need **systemic cleanup**. The "Gold/Dark/White" aesthetic is premium, but the implementation leaks "cheap" greys (`gray-50` vs `ui-background`).

*   **Philosophy**: Every pixel must come from a Token. If a color isn't in the system, add it to the system or don't use it.
*   **Goal**: A UI that looks identical whether coded by a junior or senior developer because the primitives allow no other option.

## ⚠️ Anti-Patterns to Avoid
*   ⛔ **No Magic Numbers**: Avoid `w-[32rem]`, `top-[45px]`. Add them to the spacing scale if reusable.
*   ⛔ **No "Just One Time" Styles**: Do not write `style={{ ... }}` or arbitrary `text-[#123456]`. Use the tokens.
*   ⛔ **No Mixed Icon Sets**: Don't mix Material Symbols (font-based) with Lucide (SVG-based). It hurts load performance and visual alignment.
