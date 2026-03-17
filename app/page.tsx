import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          Never miss a government contract
        </h1>
        <p className="text-xl text-gray-500">
          ContractPulse monitors SAM.gov and alerts you to opportunities that
          match your business profile — before the deadline slips by.
        </p>
        <Link
          href="/signup"
          className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Get started free
        </Link>
      </div>
    </main>
  );
}
