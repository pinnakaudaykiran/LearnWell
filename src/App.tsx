import { useEffect, useState } from 'react'
import './App.css'
import CareerPath from './CareerPath'
import StudyCircle from './StudyCircle'

const KEY = 'learnwell-progress'
const ideas = ['Photosynthesis', 'Algebra basics', 'The water cycle']
type Progress = { topic: string; done: boolean }
type Quiz = { question: string; options: [string, string]; answer: number }
function makeQuiz(value: string): Quiz {
  const normalized = value.toLowerCase()
  if (normalized.includes('photo')) return { question: 'What do plants use sunlight to help make?', options: ['Food (sugar)', 'Soil'], answer: 0 }
  if (normalized.includes('algebra')) return { question: 'In x + 3 = 7, what number is x?', options: ['10', '4'], answer: 1 }
  if (normalized.includes('water cycle') || normalized.includes('water')) return { question: 'What happens when water vapour cools?', options: ['It condenses into tiny drops', 'It turns into sunlight'], answer: 0 }
  return { question: 'What is a helpful first step when learning ' + value + '?', options: ['Memorize every detail at once', 'Understand the main idea first'], answer: 1 }
}
const empty: Progress = { topic: '', done: false }
function load(): Progress {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') || empty } catch { return empty }
}

function App() {
  const [progress, setProgress] = useState<Progress>(load)
  const [activeHash, setActiveHash] = useState(window.location.hash || '#learn')
  const [topic, setTopic] = useState(progress.topic)
  const [lesson, setLesson] = useState(progress.topic)
  const [answer, setAnswer] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [outcome, setOutcome] = useState<'correct' | 'retry' | null>(null)
  const [aiExplanation, setAiExplanation] = useState('')
  const [quiz, setQuiz] = useState<Quiz>(() => makeQuiz(progress.topic || 'a new topic'))
  const [aiLoading, setAiLoading] = useState(false)
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(progress)) }, [progress])
  useEffect(() => { const updateHash = () => setActiveHash(window.location.hash || '#learn'); window.addEventListener('hashchange', updateHash); return () => window.removeEventListener('hashchange', updateHash) }, [])

  async function start(value = topic) {
    const clean = value.trim()
    if (!clean) { setMessage('Add a topic to begin your lesson.'); return }
    setTopic(clean); setLesson(clean); setAnswer(null); setMessage(''); setOutcome(null); setAiExplanation(''); setQuiz(makeQuiz(clean))
    setProgress((old) => ({ ...old, topic: clean }))
    setAiLoading(true)
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: clean, mode: 'lesson' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The AI tutor is unavailable.')
      setAiExplanation(result.explanation)
      const generatedQuiz = result.quiz
      if (generatedQuiz?.question && Array.isArray(generatedQuiz.options) && generatedQuiz.options.length === 2 && (generatedQuiz.answerIndex === 0 || generatedQuiz.answerIndex === 1)) {
        setQuiz({ question: generatedQuiz.question, options: [String(generatedQuiz.options[0]), String(generatedQuiz.options[1])], answer: generatedQuiz.answerIndex })
      }
      setMessage('Your AI lesson is ready.')
    } catch {
      setAiExplanation('')
      setMessage('Showing the sample lesson. Start Ollama and the local tutor server to use live AI.')
    } finally {
      setAiLoading(false)
    }
  }
  function check() {
    if (answer === null) { setMessage('Choose an answer first.'); return }
    if (answer === quiz.answer) {
      setProgress((old) => ({ ...old, done: true }))
      setOutcome('correct')
      setMessage('That’s right! You finished today’s lesson.')
    } else {
      setOutcome('retry')
      setMessage('Good try. Let’s look at the idea another way.')
    }
  }

  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="#home"><span className="brand-mark">✳</span> learnwell<span className="dot">.</span></a>
      <div className="nav-label">YOUR SPACE</div>
      <nav><a className={activeHash === '#learn' || activeHash === '#home' ? 'nav active' : 'nav'} href="#learn"><span>▦</span> My learning <b>3</b></a><a className={activeHash === '#career' ? 'nav active' : 'nav'} href="#career"><span>↗</span> Career paths</a><a className={activeHash === '#tools' ? 'nav active' : 'nav'} href="#tools"><span>✧</span> Study tools</a><a className={activeHash === '#circle' ? 'nav active' : 'nav'} href="#circle"><span>◎</span> Study circle</a></nav>
      <div className="side-bottom"><div className="habit"><b>✦ &nbsp; Small steps add up.</b><p>You’re building a lovely learning habit.</p><div>● ● ● ● ○ ○ ○</div></div><div className="profile"><span className="avatar">S</span><span>Student space<small>Free learner plan</small></span></div></div>
    </aside>
    <main id="home">
      <header className="topbar"><span>My learning <i>/</i> <b>Today</b></span><div><small>SUNDAY, OCTOBER 4</small><span className="avatar mini">S</span></div></header>
      <section className="welcome"><div><div className="eyebrow">— &nbsp; YOUR LEARNING JOURNEY</div><h1>A little progress<br/><em>goes a long way.</em></h1><p>Welcome back, learner. Let’s make today count, one curious question at a time.</p></div><div className="art" aria-hidden="true"><i className="sun"/><i className="backbook"/><div className="frontbook">learn<br/>something<br/><b>new</b></div><span>✳</span></div></section>
      <section className="stats"><article><i className="stat lavender">◷</i><div><small>LEARNING STREAK</small><strong>3 days <em>↗</em></strong><p>You’re showing up!</p></div></article><article><i className="stat peach">✧</i><div><small>LESSONS THIS WEEK</small><strong>{progress.done ? '4' : '3'} <em className="muted">/ 5 goal</em></strong><p>A good rhythm to keep</p></div></article><article><i className="stat mint">↗</i><div className="stretch"><small>WEEKLY GOAL</small><strong>{progress.done ? '68' : '52'}% <em className="muted">complete</em></strong><div className="bar"><i style={{ width: progress.done ? '68%' : '52%' }}/></div></div></article></section>
      <div className="section-title" id="learn"><div><div className="eyebrow">— &nbsp; PICK UP WHERE YOU LEFT OFF</div><h2>Your learning plan</h2></div><button onClick={() => { setTopic(''); setLesson(''); setMessage(''); setAnswer(null); setOutcome(null); document.getElementById('topic')?.focus() }}>+ New lesson</button></div>
      <section className="grid"><article className="lesson">
        <div className="lesson-bar"><b>✦ &nbsp; TODAY’S LESSON</b><small>◷ &nbsp; 8 MIN</small></div><div className="lesson-body">
          <div className="intro"><div><span className="tag">SCIENCE · BEGINNER</span><h3>{lesson || 'Ready to learn something?'}</h3><p>{lesson ? 'A simple, step-by-step introduction made for you.' : 'Pick a topic and your next lesson starts here.'}</p></div><span className="plant">♧</span></div>
          <form onSubmit={(event) => { event.preventDefault(); start() }}><label htmlFor="topic">What would you like to learn today?</label><div className="input-row"><input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Try “fractions” or “how plants grow”"/><button className="primary" disabled={aiLoading}>{aiLoading ? 'Thinking…' : 'Start learning'} <b>{aiLoading ? '✦' : '→'}</b></button></div><div className="suggestions"><small>TRY:</small>{ideas.map((idea) => <button type="button" key={idea} onClick={() => { setTopic(idea); start(idea) }}>{idea}</button>)}</div><div className="privacy-hint">Your topic is sent to the local AI model on this computer.</div></form>
          {message && <div className={message.startsWith('That') || message.startsWith('Your AI') ? 'message success' : 'message'} role="status">{message}</div>}
          {outcome === 'retry' && <div className="coach-card"><span>✦</span><div><b>Let’s make it simpler</b><p>Start with the big idea before memorizing details. For {lesson.toLowerCase().includes('photo') ? 'photosynthesis, the big idea is that plants use sunlight to make food.' : lesson.toLowerCase().includes('algebra') ? 'algebra, the big idea is finding the missing number.' : 'this topic, try explaining the main idea in your own words.'}</p><small>Try the answer that focuses on understanding first.</small></div></div>}
          {outcome === 'correct' && <div className="coach-card coach-success"><span>↗</span><div><b>Ready for a stretch?</b><p>You’ve got the main idea. Try explaining {lesson} in one sentence, as if you were helping a friend.</p><small>Your next step: teach it back in your own words.</small></div></div>}
          {lesson && <div className="explanation"><div className="explain-title"><span>✦</span><div><b>Your quick explanation</b><small>{aiExplanation ? 'Generated locally for your topic' : 'Clear ideas, one step at a time'}</small></div><em>{aiExplanation ? 'LOCAL AI' : 'SAMPLE'}</em></div><p>{aiExplanation || <><b>{lesson}</b> is easier to understand when we break it into small pieces. Start with the main idea, connect it to something familiar, then check what you remember.</>}</p><div className="quiz"><small>QUICK CHECK</small><p>{quiz.question}</p>{quiz.options.map((option, index) => <button key={option} className={answer === index ? 'option picked' : 'option'} type="button" onClick={() => { setAnswer(index); setMessage(''); setOutcome(null) }}><i>{index === 0 ? 'A' : 'B'}</i> {option}</button>)}<button className="check" type="button" onClick={check}>Check my answer &nbsp; →</button></div></div>}
        </div><footer className="lesson-footer"><span>✦ &nbsp; Your pace, your path.</span><small>LESSON 01 · 03</small></footer>
      </article><aside className="right"><article className="week"><small>✺ &nbsp; THIS WEEK</small><h3>Your weekly goal</h3><p>Five little learning moments. You’re on your way.</p><div className="days">{['M','T','W','T','F','S','S'].map((day, i) => <span key={day + i}>{day}<i className={i < (progress.done ? 4 : 3) ? 'done' : ''}>{i < (progress.done ? 4 : 3) ? '✓' : ''}</i></span>)}</div><div className="week-foot">● &nbsp; {progress.done ? '4 of 5' : '3 of 5'} lessons complete <b>{progress.done ? '80' : '60'}%</b></div></article><article className="quote"><span>“</span><p>Curiosity is the<br/>beginning of learning.</p><small>A NOTE FOR TODAY</small><i>✿</i></article><div className="privacy">⌑ &nbsp; Your progress stays on this device.</div></aside></section>
      <footer className="page-footer"><span>Made for curious minds ✦</span><small>YOUR JOURNEY, AT YOUR PACE</small></footer>
      <CareerPath />
      <StudyCircle />
    </main>
  </div>
}
export default App




