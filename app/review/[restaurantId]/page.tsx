"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ReviewPage() {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadName() {
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`);
        if (!res.ok) return;
        const data = await res.json();
        setRestaurantName(data.name ?? "");
      } catch {
        // Keep the page usable even if the name lookup fails.
      }
    }
    if (restaurantId) loadName();
  }, [restaurantId]);

  const canSubmit = rating >= 1 && comment.trim().length > 0 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: Number(restaurantId),
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Display exactly what the backend said. Do not invent our own message.
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      router.push(`/restaurant/${restaurantId}`);
    } catch {
      setError("Could not reach the server. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-[560px] px-6 py-12">
      <p className="text-sm text-[#6b675f]">
        <Link className="underline" href={`/restaurant/${restaurantId}`}>
          Back to restaurant
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold">
        {restaurantName ? `Review ${restaurantName}` : "Write a review"}
      </h1>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div>
          <p className="text-sm font-medium">Your rating</p>
          <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = n <= rating;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  aria-pressed={rating === n}
                  className={`h-11 w-11 rounded-lg border text-lg transition-colors ${
                    selected
                      ? "border-[#b3541e] bg-[#b3541e] text-white"
                      : "border-[#e7e1d6] bg-white text-[#1c1a17]"
                  }`}
                >
                  ★
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="text-sm font-medium">
            Your review
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="What did you eat? How was it?"
            className="mt-3 w-full rounded-lg border border-[#e7e1d6] bg-white px-4 py-3 text-base outline-none focus:border-[#b3541e]"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-[#e7e1d6] bg-white px-4 py-3 text-sm"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-lg bg-[#1c1a17] px-4 py-3 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </main>
  );
}