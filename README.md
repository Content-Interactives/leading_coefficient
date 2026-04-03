# Leading Coefficient

React + Vite visualization of how the leading coefficient \(a\) scales a polynomial graph (\(af(x)\) style transformations). Sliders or inputs in `LeadingCoefficient.jsx` update the plotted function.

**Live site:** [https://content-interactives.github.io/leading_coefficient](https://content-interactives.github.io/leading_coefficient)

Curriculum alignment and placement: [Standards.md](Standards.md).

---

## Stack

| Layer | Notes |
|--------|--------|
| Build | Vite 6, `@vitejs/plugin-react` |
| UI | React 19 |
| Styling | Tailwind 3 |
| Icons | lucide-react |
| Deploy | `gh-pages -d dist`; `predeploy` runs `vite build` |

---

## Layout

```
vite.config.js          # base: '/leading_coefficient/'
src/
  main.jsx → App.jsx → components/LeadingCoefficient.jsx
  components/ui/
```

---

## `vite.config.js`

`base: '/leading_coefficient/'` must match the GitHub Pages repository path.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run deploy` | Build and push `dist/` to `gh-pages` |

---

## Embedding

Confirm canvas/SVG viewport size in `LeadingCoefficient.jsx` for iframe sizing.
