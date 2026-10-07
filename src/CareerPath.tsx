import { useEffect, useState } from 'react'

type Step = { title: string; goal: string; project: string }
type Path = { career: string; summary: string; steps: Step[]; completed: number[] }
const STORAGE_KEY = 'learnwell-career-path'

function readPath(): Path | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Path | null } catch { return null }
}

export default function CareerPath() {
  const [career, setCareer] = useState(readPath()?.career || '')
  const [path, setPath] = useState<Path | null>(readPath)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (path) localStorage.setItem(STORAGE_KEY, JSON.stringify(path))
    else localStorage.removeItem(STORAGE_KEY)
  }, [path])

  async function createPath(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanCareer = career.trim()
    if (!cleanCareer) { setMessage('Enter a career to get started.'); return }
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: cleanCareer, mode: 'career' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The local career coach is unavailable.')
      if (!Array.isArray(result.steps) || result.steps.length !== 4) throw new Error('The coach could not make a complete roadmap. Try a more specific career.')
      setPath({ career: cleanCareer, summary: String(result.summary || ''), steps: result.steps, completed: [] })
      setMessage('Your career roadmap is ready. It is a learning guide, not a job guarantee.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not reach the local AI career coach. Check Ollama and the tutor server.')
    } finally {
      setBusy(false)
    }
  }

  function toggleStep(index: number) {
    setPath((current) => current ? {
      ...current,
      completed: current.completed.includes(index) ? current.completed.filter((step) => step !== index) : [...current.completed, index],
    } : current)
  }

  const progress = path ? Math.round(path.completed.length / path.steps.length * 100) : 0

  return <section className="career-section" id="career" aria-labelledby="career-title">
    <div className="career-heading">
      <div className="eyebrow">— &nbsp; EXPLORE WHAT’S NEXT</div>
      <h2 id="career-title">Build a path toward work you care about.</h2>
      <p>Choose any career. Your local AI coach will turn it into four practical learning steps and small portfolio projects.</p>
    </div>
    <div className="career-panel">
      <form className="career-form" onSubmit={createPath}>
        <label htmlFor="career-goal">What career are you curious about?</label>
        <div className="career-input-row">
          <input id="career-goal" value={career} maxLength={100} onChange={(event) => setCareer(event.target.value)} placeholder="For example, game designer or nurse" />
          <button className="primary" type="submit" disabled={busy}>{busy ? 'Building…' : path ? 'Update my path' : 'Build my path'} <b>→</b></button>
        </div>
        <div className="career-suggestions"><small>EXPLORE:</small>{['UX designer', 'Climate scientist', 'Game developer', 'Nurse'].map((example) => <button type="button" key={example} onClick={() => setCareer(example)}>{example}</button>)}</div>
        <small className="career-free-note">Runs with your local Ollama model. Roadmaps can vary in quality; verify licensing and credential requirements in your region.</small>
      </form>

      {message && <p className={message.startsWith('Your career') ? 'career-message success' : 'career-message'} role="status">{message}</p>}
      {path && <div className="career-roadmap">
        <div className="career-roadmap-top"><div><span className="career-kicker">YOUR STARTER ROADMAP</span><h3>{path.career}</h3><p>{path.summary}</p></div><div className="career-progress"><b>{progress}%</b><small>PATH DONE</small></div></div>
        <div className="career-progress-track"><i style={{ width: `${progress}%` }} /></div>
        <div className="career-steps">{path.steps.map((step, index) => <article className={path.completed.includes(index) ? 'career-step is-done' : 'career-step'} key={`${index}-${step.title}`}>
          <button type="button" className="career-step-check" aria-label={`${path.completed.includes(index) ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`} aria-pressed={path.completed.includes(index)} onClick={() => toggleStep(index)}>{path.completed.includes(index) ? '✓' : String(index + 1).padStart(2, '0')}</button>
          <div><small>STAGE {index + 1}</small><h4>{step.title}</h4><p>{step.goal}</p><div className="career-project"><b>TRY THIS</b><span>{step.project}</span></div></div>
        </article>)}</div>
      </div>}
    </div>
  </section>
}
