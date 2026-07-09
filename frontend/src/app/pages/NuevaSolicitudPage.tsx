import { SolicitudWizard } from '@features/solicitudes/components/SolicitudWizard';

export function NuevaSolicitudPage(): JSX.Element {
  return (
    <div>
      <h1>Publicar solicitud</h1>
      <SolicitudWizard />
    </div>
  );
}
