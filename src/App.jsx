import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Feed from './components/Feed'

export default function App() {
  const [mode, setMode] = useState('dok')
  const [questions, setQuestions] = useState([])
  const [concepts, setConcepts] = useState([])
  const feedRef = useRef(null)

  useEffect(() => {
    Promise.all([
      fetch('/data/questions.json').then(r => r.json()),
      fetch('/data/concepts.json').then(r => r.json()),
    ]).then(([q, c]) => {
      setQuestions(q)
      setConcepts(c)
    }).catch(console.error)
  }, [])

  function stepFeed(dir) {
    const feed = feedRef.current
    if (!feed) return
    const cardH = feed.clientHeight
    const current = Math.round(feed.scrollTop / cardH)
    feed.scrollTo({ top: (current + dir) * cardH, behavior: 'smooth' })
  }

  return (
    <>
      <Header />
      <Feed
        ref={feedRef}
        mode={mode}
        questions={questions}
        concepts={concepts}
        onStep={stepFeed}
      />
      <BottomNav mode={mode} onSwitch={setMode} />
    </>
  )
}
