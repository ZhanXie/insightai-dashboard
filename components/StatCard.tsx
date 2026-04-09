interface StatCardProps {
  label: string;
  value: number;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-sm font-medium text-gray-500">{label}</h2>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
