import DebateDetailClient from "./DebateDetailClient";

export default async function DebateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DebateDetailClient debateId={id} />;
}
