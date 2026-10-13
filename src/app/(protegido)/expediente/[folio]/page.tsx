import { HistoriaClinicaWorkspace } from '@/features/historia-clinica/components/HistoriaClinicaWorkspace';

export default async function ExpedienteFolioPage({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  return <HistoriaClinicaWorkspace key={folio} folio={decodeURIComponent(folio)} />;
}
