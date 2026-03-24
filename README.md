Flashcards [Live on Vercel](https://dokdok-two.vercel.app/) 
### Future features:
1. Progress tracking — mark questions as solved (stored in localStorage). A checkmark badge + filter to hide solved ones would make it
  actually useful as a study tool.
2. PWA / offline support [Added]— the original had sw.js but the React version doesn't. Without it, the app is just a webpage on mobile. Adding
 a Vite PWA plugin makes it installable + works offline.
3. Difficulty filter in Questions mode — the concepts mode has topic chips, but questions has no filter. Easy/Medium/Hard filter chips
would be useful.

4. Virtualized list — right now Questions and Concepts modes render all cards into the DOM at once. With 27+ questions it's fine, but as
 data grows this will lag. A virtual scroll (only render visible ± 2 cards) keeps it smooth.
5. Smooth mode transitions — switching modes currently snaps instantly. A subtle fade would feel more polished.
6. Tags as filters — clicking a tag pill (e.g. "Hash Map") could filter to questions with that tag.
### Maybe:
7. Dark mode — the design lends itself well to it.
8. Streak / stats — a simple solved-count displayed in the header.
