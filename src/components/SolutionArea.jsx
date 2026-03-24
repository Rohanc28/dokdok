import { useState } from 'react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import go from 'react-syntax-highlighter/dist/esm/languages/hljs/go'
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java'
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'

SyntaxHighlighter.registerLanguage('javascript', js)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('go', go)
SyntaxHighlighter.registerLanguage('java', java)

const LANG_LABELS = { python: 'Python', go: 'Go', javascript: 'JS', java: 'Java' }

export default function SolutionArea({ item }) {
  const langs = Object.keys(item.solutions)
  const [activeLang, setActiveLang] = useState(langs[0])

  return (
    <div className="solution-area">
      <div className="lang-tabs">
        {langs.map(lang => (
          <button
            key={lang}
            className={`lang-tab${activeLang === lang ? ' active' : ''}`}
            onClick={() => setActiveLang(lang)}
          >
            {LANG_LABELS[lang] || lang}
          </button>
        ))}
      </div>

      {item.timeComplexity && (
        <div className="complexity-row">
          <span className="complexity-badge time">Time: {item.timeComplexity}</span>
          <span className="complexity-badge space">Space: {item.spaceComplexity}</span>
        </div>
      )}

      {item.approach && (
        <div className="approach-text">{item.approach}</div>
      )}

      <SyntaxHighlighter
        language={activeLang}
        style={atomOneLight}
        customStyle={{ background: 'transparent' }}
      >
        {item.solutions[activeLang]}
      </SyntaxHighlighter>
    </div>
  )
}
