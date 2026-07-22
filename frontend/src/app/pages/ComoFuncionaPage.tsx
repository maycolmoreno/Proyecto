import { Link } from 'react-router-dom';

interface PasoFlujo {
  numero: number;
  texto: string;
}

interface Flujo {
  icono: string;
  titulo: string;
  pasos: PasoFlujo[];
  ruta: string;
}

const FLUJOS: Flujo[] = [
  {
    icono: '🎁',
    titulo: 'Donar',
    ruta: '/donaciones',
    pasos: [
      { numero: 1, texto: 'Publicá el objeto: categoría, título, estado y fotos.' },
      { numero: 2, texto: 'Indicá si alguien debe retirarlo en tu domicilio o coordinás la entrega.' },
      { numero: 3, texto: 'Aceptás quién lo recibe y coordinás la entrega desde la plataforma.' },
    ],
  },
  {
    icono: '🙏',
    titulo: 'Pedir ayuda',
    ruta: '/solicitudes',
    pasos: [
      { numero: 1, texto: 'Creá tu solicitud: qué necesitás, categoría y urgencia.' },
      { numero: 2, texto: 'Un donante con ese objeto te ofrece ayuda — queda aceptado al instante.' },
      { numero: 3, texto: 'Coordinás la entrega o el retiro desde la plataforma.' },
    ],
  },
  {
    icono: '🔄',
    titulo: 'Truequear',
    ruta: '/trueques',
    pasos: [
      { numero: 1, texto: 'Publicá el objeto que ofrecés para intercambiar.' },
      { numero: 2, texto: 'Encontrá algo que te interese y enviá una propuesta.' },
      { numero: 3, texto: 'Cuando ambas partes acepten, coordinan la entrega.' },
    ],
  },
];

// Página informativa pública (sin auth) — reclamos verificados contra el código real, no copy
// genérico de marketing. Cada afirmación de esta página tiene una decisión de diseño real detrás.
export function ComoFuncionaPage(): JSX.Element {
  return (
    <div className="como-funciona">
      <div className="hero">
        <span className="hero__eyebrow">Cómo funciona</span>
        <h1>Así funciona DonaConnect</h1>
        <p className="hero__subtitulo">
          Conectamos a quienes tienen objetos que ya no usan con quienes los necesitan — sin dinero
          de por medio, en tres pasos.
        </p>
      </div>

      <div className="grid-publicaciones">
        {FLUJOS.map((flujo) => (
          <div key={flujo.titulo} className="tarjeta como-funciona__flujo">
            <h2>
              {flujo.icono} {flujo.titulo}
            </h2>
            <ol className="como-funciona__pasos">
              {flujo.pasos.map((paso) => (
                <li key={paso.numero}>{paso.texto}</li>
              ))}
            </ol>
            <Link to={flujo.ruta}>Explorar {flujo.titulo.toLowerCase()} →</Link>
          </div>
        ))}
      </div>

      <h2 className="como-funciona__seccion-titulo">Tu confianza, con evidencia</h2>
      <div className="grid-publicaciones">
        <div className="tarjeta">
          <h3>🔒 Tu ubicación exacta</h3>
          <p>
            Nunca se muestra públicamente. Los listados de donaciones y solicitudes solo muestran
            provincia y ciudad — la dirección exacta solo la ve quien vos autorices al coordinar
            una entrega.
          </p>
        </div>
        <div className="tarjeta">
          <h3>🛡️ Moderación asistida</h3>
          <p>
            Un sistema de inteligencia artificial revisa cada publicación nueva en busca de
            contenido inadecuado o riesgoso, pero nunca decide solo: un administrador humano tiene
            la última palabra antes de bloquear o eliminar algo.
          </p>
        </div>
        <div className="tarjeta">
          <h3>🔑 Seguridad de tu cuenta</h3>
          <p>
            Tu contraseña se guarda cifrada, nunca en texto plano. Tu sesión expira sola después de
            un tiempo, así que cerrarla en un equipo compartido siempre es seguro.
          </p>
        </div>
      </div>
    </div>
  );
}
