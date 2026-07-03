# Glitch Hover Effect on Textual Buttons — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `GlitchText` hover effect (CRT displacement + chromatic aberration) — currently only on desktop nav links — to all textual buttons and text links, with keyboard-focus parity and `prefers-reduced-motion` support.

**Architecture:** `ArrowLink` is the shared choke point for most textual buttons, so it wraps its inner content in `GlitchText` once. The remaining raw text links (contact email/phone, mobile nav) are wrapped directly. `GlitchText` and `globals.css` are upgraded to also fire on keyboard focus and to disable the animation under reduced-motion.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, next-intl.

## Global Constraints

- Use the `@/*` path alias for imports (maps to `./src/*`).
- No new dependencies. No new test framework.
- **No automated test runner exists** in this project (Playwright is present but unconfigured, and there is no `test` script). Verification for every task is: `npm run tsc`, `npm run lint`, and the explicit manual browser checks listed in the task. Do not scaffold a test framework.
- `GlitchText` renders `<svg …/>` + `<span class="glitch-text …">`; it applies its `className` prop to the span (`["glitch-text", className].filter(Boolean).join(" ")`).
- The glitch effect is text-based (SVG glyph displacement + `text-shadow` chromatic aberration) — never apply it to icon-only links.
- Commit after each task with a `feat:` / `refactor:` message.

---

## File Structure

- `src/components/GlitchText.tsx` — **modify.** Add keyboard-focus trigger + reduced-motion guard to the displacement.
- `src/app/globals.css` — **modify.** Add focus-visible parity for the chromatic animation; add a reduced-motion media query; remove the mobile-nav letter-spacing hover.
- `src/components/ArrowLink.tsx` — **modify.** Wrap inner content (label + arrow) in `GlitchText`.
- `src/components/ContactSection.tsx` — **modify.** Wrap email + phone labels in `GlitchText`.
- `src/components/StickyNav.tsx` — **modify.** Wrap mobile nav labels in `GlitchText`.

---

## Task 1: Upgrade `GlitchText` — focus trigger + reduced-motion guard

**Files:**

- Modify: `src/components/GlitchText.tsx:16-26`

**Interfaces:**

- Consumes: nothing new.
- Produces: unchanged public API — `GlitchText({ children, className })`. Behavior additions only: displacement now also fires when the closest focusable ancestor (`a`, `button`, `[tabindex]`) receives focus, and does nothing when `prefers-reduced-motion: reduce` is set.

**Why the ancestor walk:** the `.glitch-text` span is not itself focusable; it lives inside an `<a>`/`<button>`. Keyboard focus lands on that ancestor, so the JS listener must attach there (via `el.closest(...)`), and `focusin` is used because it bubbles.

- [ ] **Step 1: Replace the effect hook**

In `src/components/GlitchText.tsx`, replace this block:

```tsx
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  function trigger() {
    (
      document.getElementById(animId) as SVGAnimateElement | null
    )?.beginElement();
  }
  el.addEventListener("mouseenter", trigger);
  return () => el.removeEventListener("mouseenter", trigger);
}, [animId]);
```

with:

```tsx
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const focusTarget = el.closest("a, button, [tabindex]") ?? el;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function trigger() {
    if (reduceMotion.matches) return;
    (
      document.getElementById(animId) as SVGAnimateElement | null
    )?.beginElement();
  }
  el.addEventListener("mouseenter", trigger);
  focusTarget.addEventListener("focusin", trigger);
  return () => {
    el.removeEventListener("mouseenter", trigger);
    focusTarget.removeEventListener("focusin", trigger);
  };
}, [animId]);
```

- [ ] **Step 2: Type-check**

Run: `npm run tsc`
Expected: `TypeScript compilation completed` (exit 0).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Manual check**

Run `npm run dev`. On the homepage desktop nav, Tab through the links with the keyboard — the CRT displacement should now fire on focus (previously hover-only). Hover still works. Enable OS "Reduce motion" and reload — no displacement on hover/focus.

- [ ] **Step 5: Commit**

```bash
git add src/components/GlitchText.tsx
git commit -m "feat: trigger glitch on focus and respect reduced-motion"
```

---

## Task 2: `globals.css` — focus-visible parity, reduced-motion, drop mobile letter-spacing

**Files:**

- Modify: `src/app/globals.css:127-129` (glitch hover rule)
- Modify: `src/app/globals.css:133-146` (mobile-nav-links block)

**Interfaces:**

- Consumes: the `glitch-chroma` keyframe (already defined at `globals.css:101`), the `.glitch-text` class, and the fact that every `.glitch-text` is nested inside an `a` or `button`.
- Produces: chromatic animation now runs on hover **and** on keyboard focus of the wrapping `a`/`button`; both are disabled under reduced-motion.

- [ ] **Step 1: Extend the chromatic trigger + add reduced-motion guard**

Replace:

```css
.glitch-text:hover {
  animation: glitch-chroma 480ms ease 1;
}
```

with:

```css
.glitch-text:hover,
a:focus-visible .glitch-text,
button:focus-visible .glitch-text {
  animation: glitch-chroma 480ms ease 1;
}

@media (prefers-reduced-motion: reduce) {
  .glitch-text:hover,
  a:focus-visible .glitch-text,
  button:focus-visible .glitch-text {
    animation: none;
  }
}
```

- [ ] **Step 2: Remove the mobile-nav letter-spacing hover**

Delete this block (it is being replaced by the glitch effect in Task 5 so mobile matches desktop):

```css
.mobile-nav-links li {
  transition:
    opacity 150ms ease,
    letter-spacing 150ms ease;
}

.mobile-nav-links:hover li {
  opacity: 0.25;
}

.mobile-nav-links:hover li:hover {
  opacity: 1;
  letter-spacing: 0.22em;
}
```

- [ ] **Step 3: Type-check + lint**

Run: `npm run tsc && npm run lint`
Expected: both pass. (CSS is not type-checked, but this confirms nothing else broke.)

- [ ] **Step 4: Manual check**

With `npm run dev` running: on desktop, Tab to a nav link — the color-split (chromatic) animation now fires on focus, not just hover. Under OS "Reduce motion", neither hover nor focus produces the color split. (Mobile nav is verified in Task 5.)

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: glitch chroma on focus-visible + reduced-motion guard"
```

---

## Task 3: Bake glitch into `ArrowLink` (Read more / Contact / Back / work-detail nav)

**Files:**

- Modify: `src/components/ArrowLink.tsx`

**Interfaces:**

- Consumes: `GlitchText` from `@/components/GlitchText` (default export; props `{ children, className }`).
- Produces: unchanged `ArrowLink` public API. The whole button (label + arrow) now glitches as one unit; the existing `group-hover` arrow-slide is preserved because `group` stays on the outer `Tag`.

**Layout note:** the flex layout must move from the `Tag` onto the `GlitchText` span, otherwise the span becomes the single flex child and the `gap-2` between arrow and label is lost. Keep only `group` on `Tag`; put `inline-flex items-center gap-2` on `GlitchText`.

- [ ] **Step 1: Import `GlitchText`**

At the top of `src/components/ArrowLink.tsx`, add below the existing imports:

```tsx
import GlitchText from "@/components/GlitchText";
```

- [ ] **Step 2: Wrap the content and move flex classes to the span**

Replace:

```tsx
return (
  <Tag
    {...linkProps}
    className={`group inline-flex items-center gap-2 ${className}`}
  >
    {content}
  </Tag>
);
```

with:

```tsx
return (
  <Tag {...linkProps} className={`group ${className}`}>
    <GlitchText className="inline-flex items-center gap-2">
      {content}
    </GlitchText>
  </Tag>
);
```

- [ ] **Step 3: Type-check + lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 4: Manual check**

With `npm run dev`: on the homepage About/Who-am-I sections hover "Read more" / "Contact" — the label and arrow glitch together, arrow still slides. Tab to them — glitch fires on focus. Open a work detail page (`/en/work/<uid>`) and check the "Back" link and the detail nav links behave the same. Confirm the arrow and text stay on one line with correct spacing.

- [ ] **Step 5: Commit**

```bash
git add src/components/ArrowLink.tsx
git commit -m "feat: apply glitch effect to ArrowLink buttons"
```

---

## Task 4: Glitch the contact email + phone links

**Files:**

- Modify: `src/components/ContactSection.tsx:84-107`

**Interfaces:**

- Consumes: `GlitchText` from `@/components/GlitchText`.
- Produces: email and phone labels wrapped in `GlitchText`; the anchors' existing `hover:opacity-70 focus-visible:opacity-70` and PostHog `onClick` are untouched.

- [ ] **Step 1: Import `GlitchText`**

At the top of `src/components/ContactSection.tsx`, add below the existing imports:

```tsx
import GlitchText from "@/components/GlitchText";
```

- [ ] **Step 2: Wrap the email label**

Replace `{t("email")}` inside the email anchor:

```tsx
<a
  href={`mailto:${t("email")}`}
  className="transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none"
  onClick={() => posthog.capture("contact_link_clicked", { type: "email" })}
>
  {t("email")}
</a>
```

so the label reads `<GlitchText>{t("email")}</GlitchText>`:

```tsx
<a
  href={`mailto:${t("email")}`}
  className="transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none"
  onClick={() => posthog.capture("contact_link_clicked", { type: "email" })}
>
  <GlitchText>{t("email")}</GlitchText>
</a>
```

- [ ] **Step 3: Wrap the phone label**

Do the same for the phone anchor — replace `{t("phone")}` with `<GlitchText>{t("phone")}</GlitchText>`:

```tsx
<a
  href={`tel:${t("phone").replace(/\s/g, "")}`}
  className="transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none"
  onClick={() => posthog.capture("contact_link_clicked", { type: "phone" })}
>
  <GlitchText>{t("phone")}</GlitchText>
</a>
```

- [ ] **Step 4: Type-check + lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 5: Manual check**

With `npm run dev`: scroll to the Contact section. Hover the email and phone — they glitch. Tab to them — glitch on focus. Clicking still triggers mailto/tel (PostHog capture unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/components/ContactSection.tsx
git commit -m "feat: apply glitch effect to contact email and phone links"
```

---

## Task 5: Glitch the mobile nav labels

**Files:**

- Modify: `src/components/StickyNav.tsx:144-167`

**Interfaces:**

- Consumes: `GlitchText` — **already imported** in `StickyNav.tsx` (line 7). Do not add a duplicate import.
- Produces: mobile menu labels wrapped in `GlitchText`, matching the desktop nav. Pairs with the letter-spacing CSS removal from Task 2.

- [ ] **Step 1: Wrap the mobile blog label**

In the mobile overlay `<ul className="mobile-nav-links …">`, replace the blog branch's `{t(item)}`:

```tsx
<li key={item} style={animationStyle}>
  <Link
    href={`/${locale}/blog`}
    tabIndex={menuOpen ? 0 : -1}
    className="focus-visible:opacity-70 focus-visible:outline-none"
    onClick={() => setMenuOpen(false)}
  >
    {t(item)}
  </Link>
</li>
```

so the label reads `<GlitchText>{t(item)}</GlitchText>`:

```tsx
<li key={item} style={animationStyle}>
  <Link
    href={`/${locale}/blog`}
    tabIndex={menuOpen ? 0 : -1}
    className="focus-visible:opacity-70 focus-visible:outline-none"
    onClick={() => setMenuOpen(false)}
  >
    <GlitchText>{t(item)}</GlitchText>
  </Link>
</li>
```

- [ ] **Step 2: Wrap the mobile anchor label**

Do the same for the non-blog branch — replace `{t(item)}` with `<GlitchText>{t(item)}</GlitchText>`:

```tsx
<li key={item} style={animationStyle}>
  <a
    href={`#${item}`}
    tabIndex={menuOpen ? 0 : -1}
    className="focus-visible:opacity-70 focus-visible:outline-none"
    onClick={handleNavClick}
  >
    <GlitchText>{t(item)}</GlitchText>
  </a>
</li>
```

- [ ] **Step 3: Type-check + lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 4: Manual check**

With `npm run dev`, in a narrow (mobile) viewport: open the hamburger menu, hover/tap the links — they glitch like the desktop nav, and the old dim-others letter-spacing effect is gone. Tapping a link still scrolls/navigates and closes the menu.

- [ ] **Step 5: Commit**

```bash
git add src/components/StickyNav.tsx
git commit -m "feat: apply glitch effect to mobile nav links"
```

---

## Final Verification

- [ ] Run `npm run tsc` — passes.
- [ ] Run `npm run lint` — passes.
- [ ] Full manual pass across all button types (hover + keyboard focus): desktop nav, Read more, Contact, Back, work-detail nav, contact email/phone, mobile nav.
- [ ] With OS "Reduce motion" enabled: no displacement wobble and no chromatic color-split anywhere; opacity hover still works.
