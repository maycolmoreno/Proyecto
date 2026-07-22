import { Button } from '@shared/components/atoms/Button';

// Componente reutilizable (ADR-045): puramente presentacional, todo por props — no importa
// features/ia (regla de shared/, Fase 1 sección 9.3). Sugerencia editable, nunca autoaplicada
// (ADR-010, human-in-the-loop): el padre decide cómo mapear/aplicar los campos al aceptar.
interface Sugerencia {
  tituloSugerido: string;
  descripcionSugerida: string;
  prioridadSugerida: string | null;
}

interface IASuggestionBoxProps {
  sugerencia: Sugerencia | null;
  cargando: boolean;
  aplicada: boolean;
  onSugerir: () => void;
  onAplicar: () => void;
}

export function IASuggestionBox({ sugerencia, cargando, aplicada, onSugerir, onAplicar }: IASuggestionBoxProps): JSX.Element {
  return (
    <div className="ia-suggestion-box">
      {!sugerencia ? (
        <Button type="button" variant="secundario" onClick={onSugerir} disabled={cargando}>
          {cargando ? 'Consultando IA…' : '✨ Sugerir con IA'}
        </Button>
      ) : (
        <div className="ia-suggestion-box__resultado">
          <p>
            <strong>Sugerencia de la IA</strong>
          </p>
          <p>Título: {sugerencia.tituloSugerido}</p>
          <p>Descripción: {sugerencia.descripcionSugerida}</p>
          {sugerencia.prioridadSugerida ? <p>Prioridad: {sugerencia.prioridadSugerida}</p> : null}
          {!aplicada ? (
            <Button type="button" onClick={onAplicar}>
              Usar esta sugerencia
            </Button>
          ) : (
            <p>✓ Aplicada — puedes seguir editando los campos.</p>
          )}
        </div>
      )}
    </div>
  );
}
