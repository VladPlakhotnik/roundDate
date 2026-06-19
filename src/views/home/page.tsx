import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { getHomeEvents } from "@/entities/events";
import { getAuth } from "@/shared/server/auth/auth";
import { getDb } from "@/shared/server/db/client";
import { profiles } from "@/shared/server/db/schema";
import { HomeAtmosphere } from "@/widgets/home-atmosphere";
import { HomeEvents } from "@/widgets/home-events";
import type { HomeViewer } from "@/widgets/home-hero";
import { HomeHero } from "@/widgets/home-hero";
import { HomeHowItWorks } from "@/widgets/home-how-it-works";
import { HomeWaitlistFooter } from "@/widgets/home-waitlist-footer";
import { HomeWhyBetter } from "@/widgets/home-why-better";

import styles from "./page.module.css";

function getDisplayName(input: {
  email: string;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  name?: string | undefined;
}) {
  const profileName = [input.firstName, input.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  if (profileName) {
    return profileName;
  }

  const authName = input.name?.trim();

  if (authName) {
    return authName;
  }

  return input.email.split("@")[0] ?? "Профиль";
}

async function getHomeViewer(): Promise<HomeViewer | null> {
  const requestHeaders = await headers();

  try {
    const session = await getAuth().api.getSession({ headers: new Headers(requestHeaders) });

    if (!session?.user) {
      return null;
    }

    const db = getDb();
    const [profile] = await db
      .select({
        firstName: profiles.firstName,
        lastName: profiles.lastName,
      })
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    return {
      displayName: getDisplayName({
        email: session.user.email,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        name: session.user.name ?? "",
      }),
      email: session.user.email,
      image: session.user.image ?? null,
    };
  } catch {
    return null;
  }
}

export async function HomeView() {
  const [events, viewer] = await Promise.all([getHomeEvents(), getHomeViewer()]);
  const featuredEvent = events[0];

  return (
    <main className={styles.root}>
      <div className={styles.topBand}>
        <HomeHero {...(featuredEvent ? { featuredEvent } : {})} viewer={viewer} />
        <HomeHowItWorks />
      </div>
      <div className={styles.whiteBand}>
        <HomeWhyBetter />
        <HomeEvents events={events} />
        <HomeAtmosphere />
      </div>
      <div className={styles.waitlistBand}>
        <HomeWaitlistFooter />
      </div>
    </main>
  );
}
