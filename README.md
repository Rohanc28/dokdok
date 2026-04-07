
Progressive web app for drilling DSA problems and concepts. Card-swipe feed with topic filters, multiple themes, offline support via service worker, and a Python scraper to populate the question bank. Simplified Flashcard app for Data Structures & Algorithms revision. Swipe through questions and concepts in a reel feed — built as a PWA so it installs on your phone and works offline.

## Features

- **Main mode** — endless shuffle of random questions, new cards load as you scroll
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

## Deployment
Flashcards [Live on Vercel](https://dokdok-two.vercel.app/) 

### Future features:
1. Progress tracking : mark questions as solved (stored in localStorage). A checkmark badge + filter to hide solved ones would make it
  actually useful as a study tool.
2. [**Added**] PWA / offline support: the original had sw.js but the React version doesn't. Without it, the app is just a webpage on mobile. Adding
 a Vite PWA plugin makes it installable + works offline.
3. [**Added**] Difficulty filter in Questions mode : the concepts mode has topic chips, but questions has no filter. Easy/Medium/Hard filter chips
would be useful.

4. Virtualized list : right now Questions and Concepts modes render all cards into the DOM at once. With 27+ questions it's fine, but as
 data grows this will lag. A virtual scroll (only render visible ± 2 cards) keeps it smooth.
5. Smooth mode transitions — switching modes currently snaps instantly. A subtle fade would feel more polished.
6. [**Added**] Tags as filters : clicking a tag pill (e.g. "Hash Map") could filter to questions with that tag.
7. [**Ongoing**] System Design : Questions and Concepts maybe including real-world postmortems and bried analysis
### Maybe:
7. Dark mode.
8. Streak / stats: a simple solved-count displayed in the header.
