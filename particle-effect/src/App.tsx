import targetImg from './assets/target.png'
import ParticleEffect from './components/ParticleEffect'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <ParticleEffect className='particle-effect' 
        imageSrc={targetImg}
        gap={2}
        mouseRadius={88}
        stiffness={0.005}
        damping={0.85}
        particleSize={0.5}
        particleColor={0xffffff}
        repelStrength={1}
      />
    </main>
  )
}

export default App
