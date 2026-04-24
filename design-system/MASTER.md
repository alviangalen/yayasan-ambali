# Yayasan Ambali Design System (MASTER)

This is the global source of truth for the Yayasan Ambali design system. All pages and components must adhere to these rules unless a page-specific override exists.

## Core Identity
- **Product Type**: Social Foundation / Creator Economy Platform
- **Vibe**: Premium, Trustworthy, Modern, Immersive
- **Design Era**: 2020s Modern / Glassmorphism

## Color Palette
| Token | Value | Use Case |
|-------|-------|----------|
| `--bg-dark` | `#0a0a0f` | Main background color |
| `--bg-surface` | `#13131a` | Surface cards and sections |
| `--text-primary` | `#f0f0f5` | Main body text |
| `--text-secondary`| `#9a9aab` | Subtitles and muted text |
| `--accent-gold` | `#FFD700` | Primary brand color, CTAs, highlights |
| `--accent-purple`| `#9D00FF` | Secondary brand color, dots, secondary accents |
| `--glass-bg` | `rgba(25, 25, 35, 0.6)`| Glassmorphism card backgrounds |
| `--glass-border`| `rgba(255, 255, 255, 0.08)`| Subtle borders for glass elements |

## Typography
- **Headings**: `Outfit`, sans-serif (Weights: 700, 900)
- **Body**: `Inter`, sans-serif (Weights: 400, 600)

## Visual Effects
- **Glassmorphism**: 
  - `backdrop-filter: blur(15px);`
  - `background: var(--glass-bg);`
  - `border: 1px solid var(--glass-border);`
- **Gradients**:
  - `var(--gradient-glow)`: `linear-gradient(135deg, var(--accent-purple), var(--accent-gold))`
- **Shadows**: Subtle golden glow for primary buttons (`0 0 20px rgba(255, 215, 0, 0.2)`)

## Component Standards
- **Buttons**:
  - `.btn-primary`: Gold background or border, bold text, 30px radius.
  - `.btn-premium`: Gradient background (`--gradient-glow`), white text, 30px radius.
- **Cards**:
  - Use Glassmorphism rules.
  - Padding: `2rem`.
  - Border Radius: `20px`.

## Anti-Patterns (DO NOT USE)
- Avoid pure white backgrounds.
- Do not use generic blue/red for CTAs.
- Avoid sharp corners (always use 12px+ radius unless specified).
- Do not use emojis as functional icons.
