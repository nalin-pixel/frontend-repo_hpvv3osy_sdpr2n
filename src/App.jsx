import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Search, Plus, ListMusic, Music2 } from 'lucide-react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAudioPlayer(tracks) {
  const audioRef = useRef(new Audio())
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const current = tracks[index]

  useEffect(() => {
    const el = audioRef.current
    const onEnded = () => next()
    el.addEventListener('ended', onEnded)
    return () => el.removeEventListener('ended', onEnded)
  }, [index])

  useEffect(() => {
    const el = audioRef.current
    if (!current) return
    el.src = current.audio_url
    if (isPlaying) el.play().catch(() => {})
  }, [current?.audio_url])

  const play = () => {
    const el = audioRef.current
    if (!current) return
    el.play()
    setIsPlaying(true)
  }
  const pause = () => {
    audioRef.current.pause()
    setIsPlaying(false)
  }
  const toggle = () => (isPlaying ? pause() : play())
  const next = () => setIndex((i) => (i + 1) % tracks.length)
  const prev = () => setIndex((i) => (i - 1 + tracks.length) % tracks.length)

  return { current, index, setIndex, isPlaying, play, pause, toggle, next, prev }
}

function App() {
  const [tracks, setTracks] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const player = useAudioPlayer(tracks)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/tracks`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length === 0) {
            // Auto-seed if empty
            await fetch(`${API_BASE}/seed`, { method: 'POST' })
            const res2 = await fetch(`${API_BASE}/tracks`)
            const data2 = await res2.json()
            setTracks(data2)
          } else {
            setTracks(data)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return tracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.album || '').toLowerCase().includes(q)
    )
  }, [tracks, query])

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex">
      <aside className="hidden md:flex w-64 flex-col gap-2 p-4 bg-neutral-950 border-r border-neutral-800">
        <div className="flex items-center gap-2 text-xl font-semibold mb-2"><Music2 size={22}/> VibeTunes</div>
        <button className="flex items-center gap-2 px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 transition"><Plus size={16}/> New playlist</button>
        <div className="mt-4 text-neutral-400 text-sm uppercase">Library</div>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-800 transition"><ListMusic size={16}/> Playlists</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18}/>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs, artists, albums"
                className="w-full bg-neutral-800/60 border border-neutral-700 focus:border-neutral-500 rounded-md py-2 pl-9 pr-3 outline-none text-sm placeholder:text-neutral-500"
              />
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4">
            <h2 className="text-xl font-semibold mb-3">Songs</h2>
            {loading ? (
              <div className="text-neutral-400">Loading…</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map((t, i) => (
                  <button key={t.id || i} onClick={() => player.setIndex(i)} className="group relative bg-neutral-800/40 hover:bg-neutral-800 rounded-lg p-3 text-left transition">
                    <div className="aspect-square mb-2 overflow-hidden rounded-md bg-neutral-800">
                      {t.cover_url ? (
                        <img src={t.cover_url} alt={t.title} className="w-full h-full object-cover"/>
                      ) : (
                        <div className="w-full h-full grid place-items-center text-neutral-600">No Art</div>
                      )}
                    </div>
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-sm text-neutral-400 truncate">{t.artist}</div>
                    <div className="absolute right-3 bottom-16 opacity-0 group-hover:opacity-100 transition">
                      <div className="p-3 rounded-full bg-green-500 text-black shadow-lg"><Play size={18}/></div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="border-t border-neutral-800 p-3 bg-neutral-950">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-14 h-14 bg-neutral-800 rounded overflow-hidden">
                {player.current?.cover_url && <img src={player.current.cover_url} className="w-full h-full object-cover"/>}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{player.current?.title || 'Nothing playing'}</div>
                <div className="truncate text-sm text-neutral-400">{player.current?.artist || 'Select a song to start'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={player.prev} className="p-2 rounded hover:bg-neutral-800"><SkipBack/></button>
              <button onClick={player.toggle} className="p-3 rounded-full bg-white text-black hover:opacity-90">
                {player.isPlaying ? <Pause/> : <Play/>}
              </button>
              <button onClick={player.next} className="p-2 rounded hover:bg-neutral-800"><SkipForward/></button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App
