import { useEffect, useState } from 'react'
import './StudyCircle.css'

type Entry = { id: number; author: string; role: 'Student' | 'Mentor' | 'AI Coach'; text: string }
type Circle = { name: string; topic: string; entries: Entry[] }
type Flashcard = { question: string; answer: string }
const STORAGE_KEY = 'learnwell-study-circle'

function readCircle(): Circle | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Circle | null } catch { return null }
}

export default function StudyCircle() {
  const [circle, setCircle] = useState<Circle | null>(readCircle)
  const [studentName, setStudentName] = useState('Sam')
  const [circleName, setCircleName] = useState('Friday study circle')
  const [goal, setGoal] = useState('Photosynthesis')
  const [note, setNote] = useState('')
  const [role, setRole] = useState<'Student' | 'Mentor'>('Student')
  const [message, setMessage] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [duration, setDuration] = useState(15)
  const [plan, setPlan] = useState<string[]>([])
  const [completed, setCompleted] = useState<number[]>([])
  const [toolTopic, setToolTopic] = useState(circle?.topic || 'Photosynthesis')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [knownCards, setKnownCards] = useState<number[]>([])
  const [flashcardsBusy, setFlashcardsBusy] = useState(false)
  const [flashcardMessage, setFlashcardMessage] = useState('')
  const [focusMinutes, setFocusMinutes] = useState(15)
  const [secondsLeft, setSecondsLeft] = useState(15 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerMessage, setTimerMessage] = useState('')

  useEffect(() => {
    if (circle) localStorage.setItem(STORAGE_KEY, JSON.stringify(circle))
    else localStorage.removeItem(STORAGE_KEY)
  }, [circle])

  useEffect(() => {
    if (!timerRunning) return
    const timer = window.setInterval(() => setSecondsLeft((remaining) => Math.max(remaining - 1, 0)), 1000)
    return () => window.clearInterval(timer)
  }, [timerRunning])

  useEffect(() => {
    if (secondsLeft === 0 && timerRunning) {
      setTimerRunning(false)
      setTimerMessage('Focus session complete. Take a short break!')
    }
  }, [secondsLeft, timerRunning])

  function createCircle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!goal.trim() || !circleName.trim()) return
    setCircle({ name: circleName.trim(), topic: goal.trim(), entries: [] })
    setToolTopic(goal.trim())
    setMessage('Your local study circle is ready.')
  }

  function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!circle || !note.trim()) return
    const entry: Entry = { id: Date.now(), author: studentName.trim() || role, role, text: note.trim() }
    setCircle({ ...circle, entries: [...circle.entries, entry] })
    setNote('')
    setMessage('Your check-in was added to this device.')
  }

  async function askCoach() {
    if (!circle) return
    setAiBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: `For a student and mentor studying ${circle.topic}, give one short discussion question they can explore together.` }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The local AI coach is unavailable.')
      const entry: Entry = { id: Date.now(), author: 'Learnwell AI', role: 'AI Coach', text: result.explanation }
      setCircle((current) => current ? { ...current, entries: [...current.entries, entry] } : current)
      setMessage('The local AI coach added a discussion idea.')
    } catch {
      setMessage('Could not reach the local AI. Check that Ollama and the tutor server are running.')
    } finally {
      setAiBusy(false)
    }
  }

  function makePlan() {
    const topic = toolTopic.trim() || circle?.topic || goal.trim() || 'your topic'
    const middle = duration - 10
    setPlan([
      `5 min · Write down what you already know about ${topic}.`,
      `${middle} min · Learn one new idea, then explain it in your own words.`,
      '5 min · Close your notes and recall three things you learned.',
    ])
    setCompleted([])
  }

  async function generateFlashcards() {
    const cleanTopic = toolTopic.trim()
    if (!cleanTopic) { setFlashcardMessage('Enter a topic first.'); return }
    setFlashcardsBusy(true)
    setFlashcardMessage('')
    try {
      const response = await fetch('/api/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: cleanTopic, mode: 'flashcards' }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not make flashcards.')
      const cards = Array.isArray(result.cards) ? result.cards.filter((card: Flashcard) => typeof card.question === 'string' && typeof card.answer === 'string').slice(0, 3) : []
      if (cards.length !== 3) throw new Error('The local tutor could not create three cards for that topic. Try adding a little more detail.')
      setFlashcards(cards)
      setCardIndex(0)
      setKnownCards([])
      setShowAnswer(false)
      setFlashcardMessage('Your flashcards were made with the local AI.')
    } catch (error) {
      setFlashcardMessage(error instanceof Error ? error.message : 'Could not reach the local AI.')
    } finally {
      setFlashcardsBusy(false)
    }
  }

  function advanceCard(markKnown: boolean) {
    if (markKnown && !knownCards.includes(cardIndex)) setKnownCards((cards) => [...cards, cardIndex])
    if (cardIndex < flashcards.length - 1) setCardIndex((index) => index + 1)
    else setFlashcardMessage('Flashcard session complete. You knew ' + (knownCards.length + (markKnown && !knownCards.includes(cardIndex) ? 1 : 0)) + ' of ' + flashcards.length + ' cards.')
    setShowAnswer(false)
  }

  return <section className="reel-three" aria-labelledby="reel-three-title">
    <div className="reel-three-heading">
      <div className="eyebrow">— &nbsp; PART 3 · LEARN TOGETHER</div>
      <h2 id="reel-three-title">Good ideas grow in a circle.</h2>
      <p>Make a small study tool, share a check-in, and invite the local AI tutor into the discussion.</p>
      <span className="local-demo-label">LOCAL DEMO · SAVED ON THIS DEVICE</span>
    </div>

    <div className="study-kit" id="tools">
      <div className="study-kit-copy">
        <span className="circle-kicker">✧ &nbsp; YOUR PERSONAL STUDY TOOL</span>
        <h3>A study sprint that fits your goal.</h3>
        <p>Build a short, practical plan around a topic and the time you have.</p>
        <label htmlFor="sprint-topic">Study topic</label>
        <input id="sprint-topic" value={toolTopic} onChange={(event) => setToolTopic(event.target.value)} maxLength={100} placeholder="Enter any topic"/>
        <label htmlFor="sprint-duration">Study time</label>
        <select id="sprint-duration" value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
          <option value={15}>15 minutes</option>
          <option value={25}>25 minutes</option>
        </select>
        <button className="circle-primary" type="button" onClick={makePlan}>Create my study sprint <span>→</span></button>
      </div>
      <div className="study-kit-preview">
        <div className="tool-window-top"><i/><i/><i/><span>MY STUDY SPRINT</span></div>
        {plan.length ? <div className="sprint-list">{plan.map((step, index) => <label className={completed.includes(index) ? 'sprint-step completed' : 'sprint-step'} key={step}><input type="checkbox" checked={completed.includes(index)} onChange={() => setCompleted((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index])}/><span><small>STEP 0{index + 1}</small>{step}</span></label>)}</div> : <div className="tool-empty"><span>✦</span><b>Your plan will appear here</b><small>Pick 15 or 25 minutes, then create your sprint.</small></div>}
      </div>
    </div>

    <div className="study-secondary-grid">
      <article className="flashcard-tool">
        <span className="circle-kicker">✦ &nbsp; AI FLASHCARDS</span>
        <h3>Turn a topic into a quick review.</h3>
        <p>Generate three question-and-answer cards with your local tutor.</p>
        <div className="flashcard-topic-display">For <b>{toolTopic || 'your topic'}</b></div>
        <button className="circle-primary" type="button" onClick={generateFlashcards} disabled={flashcardsBusy}>{flashcardsBusy ? 'Making…' : 'Make cards'} <span>→</span></button>
        {flashcardMessage && <p className="tool-status" role="status">{flashcardMessage}</p>}
        {flashcards.length > 0 && <div className="flashcard-session"><button className="flashcard-face" type="button" onClick={() => setShowAnswer((shown) => !shown)}><small>CARD {cardIndex + 1} OF {flashcards.length} · {showAnswer ? 'ANSWER' : 'QUESTION'}</small><b>{showAnswer ? flashcards[cardIndex].answer : flashcards[cardIndex].question}</b><span>Click the card to {showAnswer ? 'see the question' : 'reveal the answer'}</span></button><div className="flashcard-controls"><button type="button" onClick={() => { setCardIndex((index) => Math.max(0, index - 1)); setShowAnswer(false) }} disabled={cardIndex === 0}>← Previous</button><button type="button" onClick={() => advanceCard(true)}>{cardIndex === flashcards.length - 1 ? 'Finish review' : 'I know this →'}</button></div><small className="known-count">{knownCards.length} of {flashcards.length} marked known</small></div>}
      </article>
      <article className="focus-tool">
        <span className="circle-kicker">◷ &nbsp; FOCUS TIMER</span>
        <h3>One task. One focus sprint.</h3>
        <p>Choose a session length, then work without switching tasks.</p>
        <label htmlFor="focus-duration">Session length</label>
        <select id="focus-duration" value={focusMinutes} disabled={timerRunning} onChange={(event) => { const minutes = Number(event.target.value); setFocusMinutes(minutes); setSecondsLeft(minutes * 60); setTimerRunning(false); setTimerMessage('') }}><option value={15}>15 minutes</option><option value={25}>25 minutes</option></select>
        <div className="timer-display" aria-live="polite">{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</div>
        <div className="timer-controls"><button className="circle-primary" type="button" onClick={() => { if (secondsLeft === 0) setSecondsLeft(focusMinutes * 60); setTimerRunning((running) => !running); setTimerMessage('') }}>{timerRunning ? 'Pause' : 'Start focus'}</button><button className="timer-reset" type="button" onClick={() => { setTimerRunning(false); setSecondsLeft(focusMinutes * 60); setTimerMessage('') }}>Reset</button></div>
        {timerMessage && <p className="tool-status" role="status">{timerMessage}</p>}
      </article>
    </div>

    <div className="circle-board" id="circle">
      <div className="circle-board-heading"><div><span className="circle-kicker">◎ &nbsp; STUDY CIRCLE</span><h3>{circle ? circle.name : 'Start a study circle'}</h3><p>{circle ? `Together, learn about ${circle.topic}.` : 'Set a shared goal, add student or mentor ideas, and ask the AI coach a question.'}</p></div>{circle && <span className="circle-topic">TODAY’S GOAL · {circle.topic}</span>}</div>
      {!circle ? <form className="circle-create" onSubmit={createCircle}>
        <label>Circle name<input value={circleName} onChange={(event) => setCircleName(event.target.value)} maxLength={48}/></label>
        <label>Learning goal<input value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={80}/></label>
        <button className="circle-primary" type="submit">Create circle <span>→</span></button>
      </form> : <>
        <div className="circle-people"><span className="person-bubble student-bubble">S</span><div><b>{studentName || 'Student'}</b><small>Student</small></div><span className="person-bubble mentor-bubble">M</span><div><b>Mentor view</b><small>Add a mentor idea below</small></div><span className="person-bubble ai-bubble">✦</span><div><b>Learnwell AI</b><small>Local tutor</small></div></div>
        <div className="circle-local-note">This prototype saves on this device. Live invites and syncing across devices are a future step.</div>
        <div className="circle-actions"><button className="circle-secondary" type="button" onClick={askCoach} disabled={aiBusy}>{aiBusy ? 'AI is thinking…' : '✦ Ask the AI coach to join'}</button><button className="text-button" type="button" onClick={() => { setCircle(null); setPlan([]); setMessage('') }}>Close circle</button></div>
        <form className="circle-note-form" onSubmit={addNote}>
          <label htmlFor="circle-author">Add a check-in</label>
          <div className="circle-note-fields"><input id="circle-author" aria-label="Your display name" value={studentName} onChange={(event) => setStudentName(event.target.value)} maxLength={30}/><select value={role} onChange={(event) => setRole(event.target.value as 'Student' | 'Mentor')} aria-label="Choose student or mentor"><option>Student</option><option>Mentor</option></select></div>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Share an idea, question, or progress update…" maxLength={240}/>
          <button className="circle-primary" type="submit" disabled={!note.trim()}>Add to the circle <span>→</span></button>
        </form>
        <div className="circle-feed" aria-live="polite">{circle.entries.length ? circle.entries.map((entry) => <article className={`circle-entry ${entry.role === 'AI Coach' ? 'ai-entry' : ''}`} key={entry.id}><span className="entry-mark">{entry.role === 'AI Coach' ? '✦' : entry.role === 'Mentor' ? 'M' : 'S'}</span><div><div className="entry-heading"><b>{entry.author}</b><small>{entry.role}</small></div><p>{entry.text}</p></div></article>) : <div className="feed-empty">No check-ins yet. Add a student thought or a mentor idea to start the discussion.</div>}</div>
      </>}
      {message && <p className="circle-message" role="status">{message}</p>}
    </div>
  </section>
}
