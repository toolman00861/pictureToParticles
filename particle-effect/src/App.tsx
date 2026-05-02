import heroImg from './assets/hero.png'
import ParticleEffect from './components/ParticleEffect'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <ParticleEffect
        imageSrc={heroImg}
        gap={3}
        mouseRadius={88}
        stiffness={0.045}
        damping={0.88}
        particleSize={1.6}
        particleColor={0xf5f7ff}
        repelStrength={4.2}
      />
    </main>
  )
}

export default App
