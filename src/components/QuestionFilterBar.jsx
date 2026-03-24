const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

export default function QuestionFilterBar({ active, onSelect }) {
  return (
    <div className="concept-filter-bar">
      {DIFFICULTIES.map(d => (
        <button
          key={d}
          className={`filter-chip${active === d ? ' active' : ''}`}
          onClick={() => onSelect(d)}
        >
          {d}
        </button>
      ))}
    </div>
  )
}
