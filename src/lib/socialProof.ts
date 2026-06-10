// Shared social-proof data for the "Get started" CTAs: live investor count
// from /api/stats plus investor avatars and the average star rating from
// Senja testimonials. Both fetches run in parallel, and the result is cached
// at module level for 5 minutes (same TTL as the stats route) so a page with
// several CTAs only pays for one fetch round.

export interface SocialProof {
  uniqueInvestors: number;
  avatarUrls: string[];
  averageRating: string;
}

const FALLBACK: SocialProof = {
  uniqueInvestors: 68,
  avatarUrls: [],
  averageRating: "5.0",
};

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { data: SocialProof; expires: number } | null = null;

function getAvatar(raw: any): string {
  return (
    raw?.customer_avatar ??
    raw?.avatar ??
    raw?.profile_picture ??
    raw?.profile_pic ??
    raw?.customer?.avatar ??
    raw?.user?.avatar ??
    ""
  );
}

export async function getSocialProof(requestUrl: URL | string): Promise<SocialProof> {
  if (cache && Date.now() < cache.expires) {
    return cache.data;
  }

  const data: SocialProof = { ...FALLBACK };

  const [statsResult, reviewsResult] = await Promise.allSettled([
    fetch(new URL("/api/stats", requestUrl)),
    fetch(new URL("/api/testimonials", requestUrl)),
  ]);

  try {
    if (statsResult.status === "fulfilled" && statsResult.value.ok) {
      const stats = await statsResult.value.json();
      if (typeof stats.usersWithInvestments === "number") {
        data.uniqueInvestors = stats.usersWithInvestments;
      }
    }
  } catch (error) {
    console.error("Failed to fetch stats for CTA social proof:", error);
  }

  try {
    if (reviewsResult.status === "fulfilled" && reviewsResult.value.ok) {
      const payload = await reviewsResult.value.json();
      const rawList = Array.isArray(payload)
        ? payload
        : (payload?.testimonials ?? payload?.data ?? payload?.results ?? []);

      const reviews = (rawList as any[])
        .filter((t) => t?.approved === true)
        .filter((t) => !t?.video_url && !t?.video && t?.type !== "video" && !t?.has_video);

      data.avatarUrls = reviews
        .map(getAvatar)
        .filter((url) => url && url.trim().length > 0)
        .slice(0, 4);

      const ratings = reviews
        .map((t) => t?.rating ?? t?.stars)
        .filter((r) => typeof r === "number" && r > 0);
      if (ratings.length > 0) {
        data.averageRating = (
          ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
        ).toFixed(1);
      }
    }
  } catch (error) {
    console.error("Failed to fetch reviews for CTA social proof:", error);
  }

  cache = { data, expires: Date.now() + CACHE_TTL_MS };
  return data;
}
