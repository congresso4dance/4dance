import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <main style={{ 
      background: '#050505', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      color: 'white'
    }}>
      <Navbar />
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '0 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(8rem, 20vw, 15rem)', 
          margin: 0, 
          lineHeight: 1,
          background: 'linear-gradient(to bottom, #fff, #333)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 900
        }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', marginTop: '-2rem', marginBottom: '2rem' }}>
          O passo foi errado. Esta página não existe.
        </h2>
        <p style={{ color: '#888', maxWidth: '500px', marginBottom: '3rem' }}>
          Talvez o evento tenha sido removido ou o link esteja incorreto. 
          Use o menu acima ou volte para a página inicial.
        </p>
        <Link href="/" style={{ 
          background: 'var(--primary)', 
          color: 'white', 
          padding: '1rem 2rem', 
          borderRadius: '4px',
          fontWeight: 700,
          textTransform: 'uppercase'
        }}>
          Voltar para a Home
        </Link>
      </div>

      <Footer />
    </main>
  );
}
