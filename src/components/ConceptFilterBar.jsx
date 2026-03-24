export default function ConceptFilterBar({ topics, active, onSelect }) {
  return (
    <div className="concept-filter-bar">
      {topics.map(({ label }) => (
        <button
          key={label}
          className={`filter-chip${active === label ? ' active' : ''}`}
          onClick={() => onSelect(label)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
