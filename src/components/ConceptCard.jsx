import { useState, useRef, forwardRef } from 'react'
import SolutionArea from './SolutionArea'

const ConceptCard = forwardRef(function ConceptCard({ item: c, feedRef }, ref) {
  const [showSolution, setShowSolution] = useState(false)
  const innerRef = useRef(null)

  function toggleSolution() {
    setShowSolution(prev => {
      if (!prev) {
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

  return (
    <article className="card concept-card" ref={ref}>
      <div className="card-inner" ref={innerRef}>
        <div className="card-top">
          <div className="card-meta">
            <span className="badge-category">{c.category}</span>
          </div>

          <h2 className="card-title">{c.title}</h2>
          <p className="card-description">{c.description}</p>

          {c.diagram && (
            <div className="visual-section">
              <pre className="visual-diagram">{c.diagram}</pre>
            </div>
          )}

          {c.keyPoints?.length > 0 && (
            <div className="key-points">
              <h4>Key Points</h4>
              <ul className="points-list">
                {c.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>

        {showSolution && c.solutions && <SolutionArea item={c} />}

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

export default ConceptCard
