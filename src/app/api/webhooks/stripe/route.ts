export const runtime = "nodejs";

export function POST() {
  return Response.json(
    {
      ok: false,
      error: "Stripe webhook scaffold is ready. Add signature verification before enabling it.",
    },
    { status: 501 },
  );
}
