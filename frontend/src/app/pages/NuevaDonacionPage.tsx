import { DonacionWizard } from '@features/donaciones/components/DonacionWizard';

export function NuevaDonacionPage(): JSX.Element {
  return (
    <div>
      <h1>Publicar donación</h1>
      <DonacionWizard />
    </div>
  );
}
