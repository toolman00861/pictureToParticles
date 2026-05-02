import targetImg from './assets/target.png'
import TopNav from './components/TopNav'
import ParticleEffect from './components/ParticleEffect'
import './App.css'

const PARTICLE_SETTINGS = {
  gap: 3,
  imageScale: 0.9,
  mouseRadius: 88,
  stiffness: 0.001,
  damping: 0.96,
  jitterStrength: 0.4,
  particleSize: 2,
  particleColor: 0xffffff,
  repelStrength: 1,
}

const NAV_ITEMS = ['HOME', 'WORK', 'SETTING', 'ABOUT']

const PARAMETER_ITEMS = [
  { label: 'Gap', value: String(PARTICLE_SETTINGS.gap) },
  { label: 'Radius', value: String(PARTICLE_SETTINGS.mouseRadius) },
  { label: 'Damping', value: PARTICLE_SETTINGS.damping.toFixed(2) },
  { label: 'Stiffness', value: PARTICLE_SETTINGS.stiffness.toFixed(3) },
  { label: 'Jitter', value: PARTICLE_SETTINGS.jitterStrength.toFixed(1) },
  { label: 'Repel', value: PARTICLE_SETTINGS.repelStrength.toFixed(1) },
]

function App() {
  return (
    <main className="app-shell">
      <TopNav items={NAV_ITEMS} />
      <ParticleEffect
        className="particle-effect"
        imageSrc={targetImg}
        {...PARTICLE_SETTINGS}
      />
      <aside className="parameter-panel" aria-label="粒子参数">
        <p className="parameter-panel__eyebrow">Particle Tuning</p>
        <ul className="parameter-list">
          {PARAMETER_ITEMS.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  )
}

export default App
