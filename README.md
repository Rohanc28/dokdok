# DOK DOK

A TikTok-style flashcard app for Data Structures & Algorithms revision. Swipe through questions and concepts in a reel feed — built as a PWA so it installs on your phone and works offline.

## Features

- **Dok mode** — endless shuffle of random questions, new cards load as you scroll
- **Questions mode** — all questions in order, filterable by difficulty (Easy / Medium / Hard)
- **Concepts mode** — DSA concept cards filterable by topic (Trees, Graphs, Sort, Maps, Other)
- Toggle solutions with syntax-highlighted code (Python, Go, JS, Java)
- Toggle hints + data structure tags per question
- Installable PWA — works offline after first load
- Mobile swipe navigation + desktop scroll/keyboard support

## Stack

- React 18 + Vite
- `react-syntax-highlighter` for code blocks
- `vite-plugin-pwa` + Workbox for service worker & offline caching

## Getting Started

```bash
npm install
npm run dev
```

To expose on your local network (for mobile testing):

```bash
npm run dev -- --host
```

## Project Structure

```
src/
  App.jsx                   # Root — data fetching, mode state
  index.css                 # All styles
  components/
    Header.jsx
    BottomNav.jsx
    Feed.jsx                # Scroll-snap feed, navigation logic, dok endless scroll
    QuestionCard.jsx
    ConceptCard.jsx
    SolutionArea.jsx        # Syntax highlighting, language tabs, complexity
    QuestionFilterBar.jsx   # Easy / Medium / Hard filter
    ConceptFilterBar.jsx    # Topic filter
public/
  data/
    questions.json
    concepts.json
  manifest.json
```

## Deployment

Deployed on Vercel — pushes to `main` auto-deploy.
Pushes to `test` get a preview URL.
