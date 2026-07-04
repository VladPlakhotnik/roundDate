import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminShell } from "./AdminShell";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/matches",
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn(async () => ({ error: null })),
  },
}));

vi.mock("@/shared/ui/Toast", () => ({
  useToast: () => ({
    error: vi.fn(),
  }),
}));

const user = {
  email: "admin@example.com",
  image: null,
  name: "Admin User",
  role: "admin" as const,
};

describe("AdminShell", () => {
  it("starts collapsed and expands the sidebar labels on toggle", () => {
    render(
      <AdminShell user={user}>
        <div>Content</div>
      </AdminShell>,
    );

    expect(screen.getByLabelText("Открыть меню")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Мэтчи" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Рассылки" })).toBeInTheDocument();
    expect(screen.queryByText("RoundDate")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Открыть меню"));

    expect(screen.getByLabelText("Свернуть меню")).toBeInTheDocument();
    expect(screen.getByText("RoundDate")).toBeInTheDocument();
    expect(screen.getByText("Рассылки")).toBeInTheDocument();
    expect(screen.getByText("Пользователи")).toBeInTheDocument();
  });

  it("shows the team section only for admins", () => {
    render(
      <AdminShell user={user}>
        <div>Content</div>
      </AdminShell>,
    );

    expect(screen.getByRole("link", { name: "Команда" })).toBeInTheDocument();
  });

  it("hides the team section from managers", () => {
    render(
      <AdminShell user={{ ...user, role: "manager" }}>
        <div>Content</div>
      </AdminShell>,
    );

    expect(screen.queryByRole("link", { name: "Команда" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Открыть меню"));

    expect(screen.getByText("Менеджер")).toBeInTheDocument();
    expect(screen.queryByText("Команда")).not.toBeInTheDocument();
  });
});
