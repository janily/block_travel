---
version: alpha
name: "链上放映室"
description: "每个机制，一支短片。以用户上传的《起源》为视觉依据的 Web3 视频展示网站。"
colors:
  primary: "#D8BA70"
  primary-hover: "#E8CF94"
  ink: "#F5F0E6"
  muted: "#A5A7AD"
  subtle: "#858890"
  background: "#090B0E"
  surface: "#111418"
  surface-alt: "#171B20"
  art-background: "#101113"
  black: "#000000"
  line: "#2C2D31"
  line-strong: "#57503E"
  danger: "#E77A6B"
  scrollbar-thumb: "#54565C"
  scrollbar-hover: "#858890"
  scrollbar-active: "#D8BA70"
typography:
  display:
    fontFamily: '"Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", serif'
  body:
    fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif'
  mono:
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
rounded:
  control: "0.375rem"
  card: "0.375rem"
  panel: "0.625rem"
spacing:
  page-max: "76rem"
components:
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "0.375rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "0.375rem"
---

# 链上放映室 · Design

## Overview

### Creative North Star

A small screening room for independently made Chinese Web3 explainers. The visitor's job is to choose a film and watch it. The uploaded film `01-起源-预览-发送版.mp4` is the authoritative aesthetic reference: charcoal black, luminous fine gold paths, warm white Song/serif titles, and quiet utility labels. The actual opening frame is the main visual, not a stock illustration.

The signature is the film's opening frame inside a restrained gold-edged screening surface. All surrounding graphics use its thin-line grammar with much less glow. A large, calm Song headline and a single gold playback button establish hierarchy; the image has more space than the introduction.

Register: **content site**. Chinese-speaking viewers browse on desktop and mobile. No Japan-market assumptions. A single film is currently provided. Five other topics are a proposed next slate, explicitly marked 待更新. No invented videos, durations, view counts, reviews, release dates, subscriptions, wallets or accounts.

Authoritative scope: user's correction on 2026-10-19 (Asia/Shanghai), requesting a simple video showcase, with each mechanism explained by their own uploaded film. This explicitly replaces the earlier interactive-lab brief. No CMS or upload administration is in this viewer-facing prototype.

The user's next request adds a real, separately addressable video list. `/` remains the featured-film homepage; `/videos.html` is the catalogue. Its category, keyword and available-only controls browse the same honest six-entry slate. The existing visual direction and native playback model remain authoritative.

Token ownership: **runtime CSS**. Shared tokens live in `src/app/globals.css`, mapped to the approved values above. CSS Modules consume these variables. Update this contract and runtime CSS together; there is no token generation step. Original film media retains its authored colors. The tiny external favicon has fixed matching colors because external SVGs cannot inherit document custom properties.

## Colors

Gold is reserved for the main action, episode label, focus and a few lines. Warm white is primary text. Muted and subtle gray have distinct readable roles against near-black surfaces. Red is only a player error indicator. There is one dark theme, matching the provided film, and a forced-colors fallback. No background particle field, competing colored gradients or decorative autoplay.

## Typography

Display: Chinese Song/serif, 40–61px for the main headline and 24–28px for section titles, weight 500, careful line breaks. Body: local Chinese sans, 14–16px explanations and 16–17px card titles. Metadata and update status: 12–13px. The single desktop brand signature uses 10px mono; decorative English chapter labels have been removed. No font downloads or late font swaps. Chinese text stays live and selectable; the original video already includes burned-in Chinese subtitles, so no fake caption track is added.

## Layout

76rem maximum width. Header 82px desktop / 70px mobile. The desktop hero allocates more width to the actual film frame; the short introduction sits to the left. At 720px it becomes a single column with the film still within the opening viewing flow. The homepage previews up to three planned topics in plain text columns, separated by fine rules. Below 720px they become single-column rows. The film topic appears before the first play action, with the true duration and Chinese caption information nearby. No fixed-height cards or text truncation.

The independent catalogue has a short 34–46px Song title, compact filters and a quiet results bar. Available films appear first under 已更新; with one real film, its thumbnail and text form a horizontal desktop feature, becoming a vertical layout below 720px. Multiple released films use a three/two/one-column grid. All five planned topics appear separately under 后续选题 as restrained text rows. At 720px, categories form an intentional 2×2 grid and search moves below them with 16px text. Status and category text stays at least 12px, without horizontal page scrolling.

The document owns scrolling. The player dialog is constrained by the dynamic viewport and scrolls internally when needed; closing it restores the page scroll state and focus. Images reserve their real 910:512 or 16:9 geometry. The caption sits outside the image; playback affordances sit near its bottom edge and do not obscure the film's main title.

## Elevation & Depth

Dark surfaces are distinguished by 1px boundaries. The real film frame gets one quiet shadow, a restrained gold top-edge highlight and a slight hover zoom. All other surfaces remain flat. Gold glow in concept thumbnails is limited to fine lines and a few small nodes.

## Shapes

Controls and cards use 6px corners; the main film frame and player use 10px. Play affordance is circular. Thin-line diagram forms derive from the video rather than a generic cryptocurrency trading interface.

## Components

`styles.css` owns the single brand, button, film card, meta label, player and feedback systems. `catalog.css` consumes the same tokens for the separate list layout and controls. `films.js` holds the film catalogue; `cards.js` renders the shared playable film card and non-interactive planned-topic row. `app.js` owns homepage cards and shared playback. `catalog.js` owns finite local filtering and URL state. `covers.js` holds five decorative concept SVGs for topics that have not yet been uploaded.

| Token group | Runtime mapping | Consumers |
|---|---|---|
| colors | `--{name}` | Global CSS, controls, focus, concept SVGs |
| typography | `--font-{role}` | Headings, body and small editorial labels |
| rounded | `--radius-{name}` | Button, media frame, player |
| spacing | `--{name}` | Shared content width |

Native links launch available films, with direct MP4 fallback if JavaScript or dialog support is absent. Planned topics are plain text articles with visible status and no cursor, thumbnail, play icon, duration or fake click handler. Playback entries on both pages use one delegated handler. The native video controls own seeking, volume and fullscreen; the browser determines optional control availability and labels.

Header navigation gives each page a real link and one current-page marker. The homepage also links to the complete slate beside its future-film preview. The catalogue uses named search and checkbox controls, a pressed-state category group, a polite result count, and a reason-specific empty state. When the available-only filter hides otherwise matching planned topics, 查看待更新选题 removes only that filter, preserves category and query, and focuses the revealed section heading. A separate full reset remains available. Local search normalizes full-width and case variants and waits for Chinese IME composition to finish. Query, category and availability live in URL parameters so reloads and browser history restore the view. No pagination is needed for six entries.

The player uses `dialog.showModal()` for background inertness and focus containment, with a named title, close button, Escape, outside pointer-down/up dismissal and focus restoration. Close pauses media, invalidates pending play promises and cancels the loader timer. Playback starts only after a user action. The same film resumes within this page session. No persistent viewing records or analytics are stored.

Media loads only when a film is selected. Loading feedback is bounded; failures show actionable inline recovery with retry and a direct-video link. No toast, alert(), confirm(), prompt(), remote search or async application loading is needed.

Global visible scrollbar styling uses both standard properties and WebKit fallback with hover, active and forced-color states. Motion is limited to 180ms control feedback and a very small poster hover scale. Reduced motion removes transitions, the scale and loading animation. No scroll reveals hide content.

### Reconcile drift

| Previous contract | Current evidence and decision | Resolution |
|---|---|---|
| Pale-blue interactive workshop | User explicitly wants the uploaded black/gold film to define the site | Replace the global visual tokens and live UI together |
| Labs, quizzes, routes and learning progress | User wants clicking a mechanism video to watch | Retire the previous routes and localStorage learning system |
| Homepage-only video showcase | User explicitly requests a separate list page | Add a linked catalogue with finite local search and filters; retain the one real film and five visibly planned topics |

## Taste refinement · 2026-10-22

Preserve the black/gold film-derived identity and existing routes. The approved refinement prioritizes available films, concrete episode context before playback, readable mobile typography, reason-specific filter recovery and reduced decorative copy. Dials: DESIGN_VARIANCE 5, MOTION_INTENSITY 2, VISUAL_DENSITY 3. The existing buildless architecture, original film, native player and accessibility behavior remain the foundation.

## Do's and Don'ts

- Do let the film itself be the main visual and first meaningful action.
- Do distinguish uploaded videos from planned topics before any click.
- Do preserve original audio, aspect ratio and burned-in subtitles.
- Do keep native playback controls and a clear recovery path.
- Don't show invented content, watch counts, runtimes or comments.
- Don't add learning dashboards, quizzes, upload administration or wallet flows to this viewer prototype.


## Next.js MVP migration · 2026-10-22

The v1.1 development specification supersedes prototype implementation details.
Routes are now `/` and `/videos`; `/videos.html` redirects permanently and preserves query parameters.
The shared UI styles live in `src/components/ui.module.css`, global reset and runtime tokens in `src/app/globals.css`.
React components replace the prototype ES modules; JSON content replaces `films.js`.
Real media is versioned under `public/media/videos` and `public/posters`.
No concept covers are rendered for planned topics. Filtering uses the v1.1 category labels.
