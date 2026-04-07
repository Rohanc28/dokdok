import { useState, useEffect, useRef, useCallback, forwardRef } from 'react'
import QuestionCard from './QuestionCard'
import ConceptCard from './ConceptCard'
import ConceptFilterBar from './ConceptFilterBar'
import QuestionFilterBar from './QuestionFilterBar'

const TOPICS = [
  { label: 'All' },
  { label: 'Trees',         pattern: /tree|trie|avl|red.black|b-tree|segment/i },
  { label: 'Graphs',        pattern: /graph|bfs|dfs|topolog|dijkstra|bellman|floyd|spanning|union.find|dsu|cycle/i },
  { label: 'Sort',          pattern: /sort/i },
  { label: 'Maps',          pattern: /map|maps oper|hash maps/i },
  { label: 'System Design', pattern: /system design/i, matchCategory: true },
  { label: 'Other',         pattern: null },
]

function getTopicFilter(label, topics) {
  if (label === 'All') return () => true
  const topic = topics.find(t => t.label === label)
  if (!topic || !topic.pattern) {
    const pats    = topics.filter(t => t.pattern).map(t => t.pattern)
    const catPats = topics.filter(t => t.pattern && t.matchCategory).map(t => t.pattern)
    return c => !pats.some(p => p.test(c.title)) && !catPats.some(p => p.test(c.category || ''))
  }
  if (topic.matchCategory) return c => topic.pattern.test(c.category || '')
  return c => topic.pattern.test(c.title)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const DOK_BATCH = 6

const Feed = forwardRef(function Feed({ mode, questions, concepts, onStep }, feedRef) {
  const [activeTopic, setActiveTopic]           = useState('All')
  const [activeDifficulty, setActiveDifficulty] = useState('All')
  const [dokCards, setDokCards] = useState([])
  const dokPoolRef = useRef([])
  const lastCardRef = useRef(null)
  const observerRef = useRef(null)

  // Set --card-h CSS var
  useEffect(() => {
    function update() {
      const header  = document.querySelector('.app-header')
      const nav     = document.querySelector('.bottom-nav')
      const bar     = document.querySelector('.concept-filter-bar')
      const headerH = header ? header.offsetHeight : 52
      const navH    = nav    ? nav.offsetHeight    : 52
      const hasBar  = mode === 'concepts' || mode === 'questions'
      const barH    = (hasBar && bar) ? bar.offsetHeight : 0
      const h = window.innerHeight - headerH - navH - barH
      if (h > 0) document.documentElement.style.setProperty('--card-h', h + 'px')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode])

  // Reset feed scroll on mode/filter change
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [mode, activeTopic, activeDifficulty])

  // Init dok cards when questions load or mode switches to dok
  useEffect(() => {
    if (mode !== 'dok' || questions.length === 0) return
    dokPoolRef.current = []
    setDokCards(nextDokBatch(DOK_BATCH))
  }, [mode, questions])

  function nextDokBatch(count) {
    const items = []
    while (items.length < count) {
      if (dokPoolRef.current.length === 0) {
        dokPoolRef.current = shuffle(questions.map((_, i) => i))
      }
      items.push(questions[dokPoolRef.current.shift()])
    }
    return items
  }

  const appendDokBatch = useCallback(() => {
    setDokCards(prev => [...prev, ...nextDokBatch(DOK_BATCH)])
  }, [questions])

  // Infinite scroll sentinel for dok mode
  useEffect(() => {
    if (mode !== 'dok' || !lastCardRef.current) return
    observerRef.current?.disconnect()
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        obs.disconnect()
        appendDokBatch()
      }
    }, { root: feedRef.current, threshold: 0.5 })
    obs.observe(lastCardRef.current)
    observerRef.current = obs
    return () => obs.disconnect()
  }, [dokCards, mode, appendDokBatch])

  // Desktop wheel navigation
  useEffect(() => {
    let cooldown = false
    function onWheel(e) {
      // Never navigate cards while scrolling inside an open solution area
      if (e.target.closest('.solution-area')) return
      const inner = e.target.closest('.card-inner')
      if (inner) {
        const canUp   = inner.scrollTop > 0
        const canDown = inner.scrollTop + inner.clientHeight < inner.scrollHeight - 1
        if ((e.deltaY < 0 && canUp) || (e.deltaY > 0 && canDown)) return
      }
      e.preventDefault()
      if (cooldown) return
      cooldown = true
      onStep(e.deltaY > 0 ? 1 : -1)
      setTimeout(() => { cooldown = false }, 750)
    }
    document.addEventListener('wheel', onWheel, { passive: false })
    return () => document.removeEventListener('wheel', onWheel)
  }, [onStep])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      const down = ['ArrowDown', 'PageDown', ' '].includes(e.key)
      const up   = ['ArrowUp', 'PageUp'].includes(e.key)
      if (!down && !up) return
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return
      e.preventDefault()
      onStep(down ? 1 : -1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onStep])

  // Mobile swipe navigation
  useEffect(() => {
    let startY = 0
    let startInnerScrollTop = 0
    let activeInner = null
    let touchInSolution = false

    function onTouchStart(e) {
      startY = e.touches[0].clientY
      activeInner = e.target.closest('.card-inner')
      startInnerScrollTop = activeInner ? activeInner.scrollTop : 0
      touchInSolution = !!e.target.closest('.solution-area')
    }

    function onTouchEnd(e) {
      if (touchInSolution) return
      const dy = startY - e.changedTouches[0].clientY
      if (Math.abs(dy) < 40 || !activeInner) return
      const inner      = activeInner
      const scrollable = inner.scrollHeight > inner.clientHeight + 2
      if (!scrollable) return
      const atBottom        = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 4
      const atTop           = inner.scrollTop <= 4
      const startedAtBottom = startInnerScrollTop + inner.clientHeight >= inner.scrollHeight - 4
      const startedAtTop    = startInnerScrollTop <= 4
      if (dy > 0 && atBottom && startedAtBottom) onStep(1)
      else if (dy < 0 && atTop && startedAtTop)  onStep(-1)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [onStep])

  // Build card list for current mode
  let cards = []
  if (mode === 'dok') {
    cards = dokCards.map((q, i) => {
      const isLast = i === dokCards.length - 1
      return (
        <QuestionCard
          key={`dok-${i}`}
          ref={isLast ? lastCardRef : null}
          item={q}
          feedRef={feedRef}
        />
      )
    })
  } else if (mode === 'questions') {
    const filtered = activeDifficulty === 'All'
      ? questions
      : questions.filter(q => q.difficulty?.toLowerCase() === activeDifficulty.toLowerCase())
    cards = filtered.map((q, i) => (
      <QuestionCard key={i} item={q} feedRef={feedRef} />
    ))
  } else {
    const filtered = concepts.filter(getTopicFilter(activeTopic, TOPICS))
    cards = filtered.map((c, i) => (
      <ConceptCard key={i} item={c} feedRef={feedRef} />
    ))
  }

  const hasFilterBar = mode === 'concepts' || mode === 'questions'

  return (
    <>
      {mode === 'concepts' && (
        <ConceptFilterBar
          topics={TOPICS}
          active={activeTopic}
          onSelect={setActiveTopic}
        />
      )}
      {mode === 'questions' && (
        <QuestionFilterBar
          active={activeDifficulty}
          onSelect={setActiveDifficulty}
        />
      )}
      <div
        ref={feedRef}
        className={`feed${hasFilterBar ? ' has-filter-bar' : ''}`}
      >
        {cards}
      </div>
    </>
  )
})

export default Feed
