import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      <p className="text-lg">Zomato Lite is alive.</p>
      <Link
        href="/restaurant/1"
        className="rounded-lg bg-[#1c1a17] px-5 py-2.5 text-sm font-medium text-white"
      >
        Ludhiana Burrito
      </Link>
    </main>
  );
}