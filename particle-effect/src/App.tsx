import targetImg from './assets/target.png'
import ParticleEffect from './components/ParticleEffect'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <ParticleEffect className='particle-effect' 
        imageSrc={targetImg}
        gap={5}
        mouseRadius={88}
        stiffness={0.0005}
        damping={0.96}
        particleSize={2}
        particleColor={0xffffff}
        repelStrength={10}
      />
    </main>
  )
}

export default App
