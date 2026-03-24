const MODES = [
  { id: 'questions', label: 'Questions' },
  { id: 'dok',       label: 'Dok'       },
  { id: 'concepts',  label: 'Concepts'  },
]

export default function BottomNav({ mode, onSwitch }) {
  return (
    <nav className="bottom-nav">
      {MODES.map(({ id, label }) => (
        <button
          key={id}
          className={`nav-btn${mode === id ? ' active' : ''}`}
          onClick={() => onSwitch(id)}
        >
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
