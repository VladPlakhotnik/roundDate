import type { Metadata } from "next";

import { SignInView } from "@/views/sign-in/page";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Logowanie",
};

export default function SignInPage() {
  return <SignInView />;
}
