import targetImg from './assets/target.png'
import ParticleEffect from './components/ParticleEffect'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <ParticleEffect
        className="particle-effect"
        imageSrc={targetImg}
        gap={3}
        imageScale={0.9}
        mouseRadius={88}
        stiffness={0.001}
        damping={0.96}
        jitterStrength={0.4}
        particleSize={2}
        particleColor={0xffffff}
        repelStrength={1}
      />
    </main>
  )
}

export default App
