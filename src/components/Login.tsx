import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) setError(signInError.message)
    setLoading(false)
  }

  return (
    <main className="auth-state">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">Sonntagsküche</p>
        <h1>Anmelden</h1>
        <p className="muted">Melde dich an, um deine Rezepte und Pläne zu sehen.</p>
        <label>
          E-Mail
          <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Passwort
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button full-width" type="submit" disabled={loading}>
          {loading ? 'Anmeldung läuft ...' : 'Anmelden'}
        </button>
      </form>
    </main>
  )
}
