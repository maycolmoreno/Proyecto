import { SolicitudWizard } from '@features/solicitudes/components/SolicitudWizard';

export function NuevaSolicitudPage(): JSX.Element {
  return (
    <div className="pagina-wizard">
      <h1>Publicar solicitud</h1>
      <p className="pagina-wizard__subtitulo">
        Completa la información para conectar con personas que puedan ayudarte.
      </p>
      <SolicitudWizard />
    </div>
  );
}
