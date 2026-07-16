import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "10");
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") ?? "date";
    const featured = searchParams.get("featured");
    const trending = searchParams.get("trending");
    const origin = searchParams.get("origin");

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
    };

    if (origin) where.origin = origin;
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (featured === "true") where.isFeatured = true;
    if (trending === "true") where.isTrending = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { destination: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (minPrice) where.basePricePaise = { ...((where.basePricePaise as object) ?? {}), gte: parseInt(minPrice) };
    if (maxPrice) where.basePricePaise = { ...((where.basePricePaise as object) ?? {}), lte: parseInt(maxPrice) };

    type OrderBy = Record<string, string>;
    let orderBy: OrderBy = { startDate: "asc" };
    switch (sortBy) {
      case "price_asc": orderBy = { basePricePaise: "asc" }; break;
      case "price_desc": orderBy = { basePricePaise: "desc" }; break;
      case "rating": orderBy = { rating: "desc" }; break;
      case "popularity": orderBy = { currentBookings: "desc" }; break;
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where: where as Parameters<typeof prisma.trip.findMany>[0] extends { where?: infer W } ? W : never,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          destination: true,
          origin: true,
          coverImage: true,
          images: true,
          startDate: true,
          endDate: true,
          duration: true,
          basePricePaise: true,
          maxGroupSize: true,
          currentBookings: true,
          category: true,
          difficulty: true,
          rating: true,
          reviewCount: true,
          isFeatured: true,
          isTrending: true,
          tags: true,
          highlights: true,
        },
      }),
      prisma.trip.count({ where: where as Parameters<typeof prisma.trip.count>[0] extends { where?: infer W } ? W : never }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: trips,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Trips fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}
