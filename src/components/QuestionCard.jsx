import { useState, useRef, forwardRef } from 'react'
import SolutionArea from './SolutionArea'

const QuestionCard = forwardRef(function QuestionCard({ item: q, feedRef }, ref) {
  const [showSolution, setShowSolution] = useState(false)
  const [showHints, setShowHints]       = useState(false)
  const innerRef = useRef(null)

  function toggleSolution() {
    setShowSolution(prev => {
      if (!prev) {
        // Scroll card-inner to show solution after paint
        requestAnimationFrame(() => {
          const area  = innerRef.current?.querySelector('.solution-area')
          const inner = innerRef.current
          if (!area || !inner) return
          const areaRect  = area.getBoundingClientRect()
          const innerRect = inner.getBoundingClientRect()
          inner.scrollTo({ top: inner.scrollTop + (areaRect.top - innerRect.top) - 8, behavior: 'smooth' })
        })
      }
      return !prev
    })
  }

  function navigateCard(dir) {
    const feed  = feedRef.current
    if (!feed) return
    const cardH   = feed.clientHeight
    const current = Math.round(feed.scrollTop / cardH)
    feed.scrollTo({ top: (current + dir) * cardH, behavior: 'smooth' })
  }

  const ghostNum = q.number?.replace('#', '').padStart(2, '0') ?? ''

  return (
    <article className="card question-card" ref={ref}>
      {ghostNum && <div className="card-ghost-number">{ghostNum}</div>}

      <div className="card-inner" ref={innerRef}>
        <div className="card-top">
          <div className="card-meta">
            <span className={`badge-difficulty ${q.difficulty?.toLowerCase()}`}>
              {q.difficulty}
            </span>
            <span className="badge-number">{q.number}</span>
          </div>

          <h2 className="card-title">{q.title}</h2>
          <p className="card-description">{q.description}</p>

          <div className="examples-section">
            <h4>Examples</h4>
            <div className="examples-list">
              {q.examples?.map((ex, i) => (
                <div key={i} className="example-block">
                  <span className="ex-label">Example {i + 1}</span>
                  <div><strong>Input:</strong> {ex.input}</div>
                  <div><strong>Output:</strong> {ex.output}</div>
                  {ex.explanation && <div><strong>Why:</strong> {ex.explanation}</div>}
                </div>
              ))}
            </div>
          </div>

          {showHints && (
            <div className="hints-section">
              <h4>Hints</h4>
              <ul className="hints-list">
                {q.hints?.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
              {q.tags?.length > 0 && (
                <div className="tags-row">
                  <span className="tags-label">Uses:</span>
                  {q.tags.map(tag => (
                    <span key={tag} className="tag-pill">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="btn-hints" onClick={() => setShowHints(h => !h)}>
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
        </div>

        {showSolution && q.solutions && <SolutionArea item={q} />}

        <div className="card-actions">
          <button className="btn-solution" onClick={toggleSolution}>
            {showSolution ? 'TERMINATE ×' : 'INITIATE →'}
          </button>
        </div>
      </div>

      <div className="card-nav">
        <button className="card-nav-btn" onClick={() => navigateCard(-1)} aria-label="Previous">↑</button>
        <button className="card-nav-btn" onClick={() => navigateCard(1)}  aria-label="Next">↓</button>
      </div>
    </article>
  )
})

export default QuestionCard
