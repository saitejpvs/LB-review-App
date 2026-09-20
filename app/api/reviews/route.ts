import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { restaurantId, rating, comment } = body as {
    restaurantId?: unknown;
    rating?: unknown;
    comment?: unknown;
  };

  // 1. rating must be a whole number from 1 to 5
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 }
    );
  }

  // 2. comment must be a non-empty string after trimming whitespace
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json(
      { error: "Comment must not be empty." },
      { status: 400 }
    );
  }

  // 3. restaurantId must refer to a restaurant that actually exists
  if (typeof restaurantId !== "number" || !Number.isInteger(restaurantId)) {
    return NextResponse.json(
      { error: "Restaurant does not exist." },
      { status: 400 }
    );
  }

  let sql;
  try {
    sql = getSql();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database is not configured." },
      { status: 500 }
    );
  }

  const existing = await sql`
    SELECT id FROM restaurants WHERE id = ${restaurantId} LIMIT 1
  `;
  if (existing.length === 0) {
    return NextResponse.json(
      { error: "Restaurant does not exist." },
      { status: 400 }
    );
  }

  const inserted = await sql`
    INSERT INTO reviews (restaurant_id, rating, comment)
    VALUES (${restaurantId}, ${rating}, ${comment.trim()})
    RETURNING id
  `;

  return NextResponse.json(
    { success: true, reviewId: inserted[0].id as number },
    { status: 201 }
  );
}