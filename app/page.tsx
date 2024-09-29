import { PeriodicTable } from '@/components/PeriodicTable'; // Named import

export default function Home() {
  return (
    <div>
      <header className="p-6 bg-blue-600 text-white text-center">
        <h1 className="text-4xl font-bold">Periodic Table of Elements</h1>
      </header>
      <main className="p-6">
        <PeriodicTable />
      </main>
    </div>
  );
}