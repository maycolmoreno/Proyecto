import { DonacionWizard } from '@features/donaciones/components/DonacionWizard';

export function NuevaDonacionPage(): JSX.Element {
  return (
    <div className="pagina-wizard">
      <h1>Publicar donación</h1>
      <p className="pagina-wizard__subtitulo">Completa la información para conectar con personas que puedan necesitarlo.</p>
      <DonacionWizard />
    </div>
  );
}
