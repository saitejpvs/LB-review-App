"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type RestaurantData = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<RestaurantData | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/restaurants/${id}`);
        if (res.status === 404) {
          setError("Restaurant not found.");
          return;
        }
        if (!res.ok) {
          setError("Could not load the restaurant.");
          return;
        }
        setData(await res.json());
      } catch {
        setError("Could not reach the server.");
      }
    }
    if (id) load();
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-12">
        <p>{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-12">
        <p className="text-[#6b675f]">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[560px] px-6 py-12">
      <h1 className="text-2xl font-semibold">{data.name}</h1>
      <p className="mt-1 text-sm text-[#6b675f]">
        {data.cuisine} · {data.area}
      </p>

      <div className="mt-8 flex items-baseline gap-3">
        {/* This line only prints the average handed to us by the API.
            There is no calculation anywhere in this file — no AVG, no divide, no sort. */}
        <p className="text-5xl font-semibold">{data.averageRating ?? "—"}</p>
        <p className="text-sm text-[#6b675f]">
          {data.totalReviews === 0
            ? "No reviews yet"
            : `${data.totalReviews} review${data.totalReviews > 1 ? "s" : ""}`}
        </p>
      </div>

      {data.totalReviews === 0 || !data.latestReview ? (
        <div className="mt-10 rounded-lg border border-[#e7e1d6] bg-white px-5 py-8 text-center">
          <p className="font-medium">No reviews yet. Be the first.</p>
          <Link
            href={`/review/${id}`}
            className="mt-4 inline-block rounded-lg bg-[#1c1a17] px-5 py-2.5 text-sm font-medium text-white"
          >
            Write the first review
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-10 rounded-lg border border-[#b3541e] bg-white px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#b3541e]">
              Latest review
            </p>
            <p className="mt-2 text-sm">{"★".repeat(data.latestReview.rating)}</p>
            <p className="mt-2">{data.latestReview.comment}</p>
            <p className="mt-2 text-xs text-[#6b675f]">
              {formatDate(data.latestReview.createdAt)}
            </p>
          </section>

          {data.reviews.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-medium text-[#6b675f]">Older reviews</h2>
              <ul className="mt-3 space-y-3">
                {data.reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-[#e7e1d6] bg-white px-5 py-4"
                  >
                    <p className="text-sm">{"★".repeat(r.rating)}</p>
                    <p className="mt-1">{r.comment}</p>
                    <p className="mt-2 text-xs text-[#6b675f]">
                      {formatDate(r.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link
            href={`/review/${id}`}
            className="mt-10 inline-block rounded-lg bg-[#1c1a17] px-5 py-2.5 text-sm font-medium text-white"
          >
            Write a review
          </Link>
        </>
      )}
    </main>
  );
}