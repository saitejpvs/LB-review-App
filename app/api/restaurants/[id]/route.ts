import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

type ReviewRow = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);
  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
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

  const restaurants = await sql`
    SELECT id, name, cuisine, area FROM restaurants WHERE id = ${restaurantId} LIMIT 1
  `;
  if (restaurants.length === 0) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }
  const restaurant = restaurants[0] as {
    id: number;
    name: string;
    cuisine: string;
    area: string;
  };

  // averageRating and totalReviews are computed fresh on every request.
  // Nothing is stored — that is the core lesson of this app.
  const stats = await sql`
    SELECT AVG(rating)::float AS avg, COUNT(*)::int AS count
    FROM reviews WHERE restaurant_id = ${restaurantId}
  `;
  const rawAvg = stats[0].avg as number | null;
  const totalReviews = stats[0].count as number;

  const rows = (await sql`
    SELECT id, rating, comment, created_at
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at DESC
  `) as unknown as ReviewRow[];

  // Empty state: averageRating is null (not 0), because 0 would pretend
  // people voted zero stars. Null honestly means "no votes yet".
  if (rows.length === 0) {
    return NextResponse.json({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      area: restaurant.area,
      averageRating: null,
      totalReviews: 0,
      latestReview: null,
      reviews: [],
    });
  }

  const averageRating = rawAvg === null ? null : Math.round(rawAvg * 10) / 10;

  const [first, ...rest] = rows;
  const toReview = (r: ReviewRow) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  });

  return NextResponse.json({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    area: restaurant.area,
    averageRating,
    totalReviews,
    latestReview: toReview(first),
    reviews: rest.map(toReview),
  });
}