// Página temporal — reemplazada sprint a sprint por docs/PLAN_FRONTEND.md (F1-F5).
interface PlaceholderPageProps {
  titulo: string;
}

export function PlaceholderPage({ titulo }: PlaceholderPageProps): JSX.Element {
  return (
    <div>
      <h1>{titulo}</h1>
      <p>Esta sección se implementa en un sprint próximo de docs/PLAN_FRONTEND.md.</p>
    </div>
  );
}
