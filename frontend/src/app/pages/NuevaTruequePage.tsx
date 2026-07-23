import { TruequeWizard } from '@features/trueques/components/TruequeWizard';

export function NuevaTruequePage(): JSX.Element {
  return (
    <div className="pagina-wizard">
      <h1>Publicar objeto para trueque</h1>
      <p className="pagina-wizard__subtitulo">Completa la información para encontrar a alguien con quien intercambiar.</p>
      <TruequeWizard />
    </div>
  );
}
