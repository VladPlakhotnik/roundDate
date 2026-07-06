import { ImageResponse } from "next/og";

import { getEventBySlug } from "@/entities/events";
import { siteName } from "@/shared/config/site";
import {
  getCityLocative,
  getEventSeoDescription,
  isPublicEvent,
} from "@/shared/seo/event-structured-data";

export const runtime = "nodejs";
export const alt = "RoundDate speed dating event";
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = "image/png";

type EventOgImageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EventOgImage({ params }: EventOgImageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  const title = isPublicEvent(event) ? event.title : siteName;
  const badge = isPublicEvent(event)
    ? `${event.city} | ${event.ageRange} | ${event.priceLabel}`
    : "Speed dating offline";
  const date = isPublicEvent(event)
    ? `${event.dateLabel} | ${event.timeLabel} | ${getCityLocative(event.city)}`
    : "Spotkania offline w Gdańsku";
  const description = isPublicEvent(event)
    ? getEventSeoDescription(event)
    : "Kameralne wydarzenia RoundDate dla osób, które chcą poznawać ludzi offline.";

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "linear-gradient(135deg, #fff9f7 0%, #ffffff 48%, #ffe8e4 100%)",
          color: "#080c0f",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "70px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "rgba(255, 90, 82, 0.14)",
            borderRadius: 999,
            display: "flex",
            height: 360,
            position: "absolute",
            right: -120,
            top: -90,
            width: 360,
          }}
        />
        <div
          style={{
            background: "rgba(255, 90, 82, 0.12)",
            borderRadius: 999,
            bottom: -160,
            display: "flex",
            height: 430,
            left: -120,
            position: "absolute",
            width: 430,
          }}
        />

        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 18,
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
            <div
              style={{
                alignItems: "center",
                background: "#ff5a52",
                borderRadius: 24,
                color: "#ffffff",
                display: "flex",
                fontSize: 44,
                fontWeight: 900,
                height: 70,
                justifyContent: "center",
                width: 70,
              }}
            >
              ♥
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{siteName}</span>
              <span style={{ color: "#5f6973", fontSize: 20, fontWeight: 700 }}>
                Speed dating offline
              </span>
            </div>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.82)",
              border: "1px solid rgba(255, 113, 97, 0.2)",
              borderRadius: 999,
              color: "#fc4238",
              display: "flex",
              fontSize: 22,
              fontWeight: 900,
              padding: "14px 22px",
            }}
          >
            {badge}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, position: "relative" }}>
          <div
            style={{
              color: "#fc4238",
              display: "flex",
              fontSize: 30,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {date}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 900,
              letterSpacing: "-1px",
              lineHeight: 0.98,
              maxWidth: 820,
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "#5f6973",
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            color: "#272b31",
            display: "flex",
            fontSize: 24,
            fontWeight: 800,
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <span>rounddate.pl</span>
          <span>Gdańsk | Kameralnie | Bezpiecznie</span>
        </div>
      </div>
    ),
    size,
  );
}
