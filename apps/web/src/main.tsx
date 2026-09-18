import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Liveness } from '@classroom/shared';
import './style.css';
function App() {
  const [status, setStatus] = useState('Comprobando API…');
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    fetch('/health/live', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const body: Partial<Liveness> = await response.json();
      if (body.status !== 'alive' || body.scope !== 'process') throw new Error();
      setStatus('API activa');
    }).catch(() => setStatus('API no disponible')).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);
  return <main><p className="eyebrow">BASE TÉCNICA · DESARROLLO LOCAL</p><h1>Plataforma de aula</h1><p>El espacio de trabajo está preparado para comenzar.</p><section><h2>Estado del proceso</h2><p role="status">{status}</p><p>Esta comprobación solo indica que la API responde. No verifica la base de datos, las colas ni GitHub.</p></section><small>Las funciones académicas todavía no están implementadas.</small></main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
