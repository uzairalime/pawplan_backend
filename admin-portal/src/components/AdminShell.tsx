"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Flag,
  History,
  CheckCircle2,
  Dog,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  PawPrint,
  UserRound,
  Users
} from "lucide-react";
import { clearSession, getSession } from "@/lib/session";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/catalog", label: "Catalog", icon: Dog, superOnly: true },
  { href: "/quotes", label: "Quotes", icon: MessageSquareQuote, superOnly: true },
  { href: "/approvals", label: "Approvals", icon: CheckCircle2, superOnly: true },
  { href: "/reports", label: "Reports", icon: Flag, superOnly: true },
  { href: "/audit-logs", label: "Audit Logs", icon: History, superOnly: true },
  { href: "/users", label: "Users", icon: UserRound, superOnly: true },
  { href: "/admins", label: "Trainers", icon: Users, superOnly: true }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = getSession();

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <PawPrint size={24} />
          PawPlan
        </div>
        <nav className="nav">
          {navItems
            .filter((item) => !item.superOnly || session?.admin.role === "SUPER_ADMIN")
            .map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link className={active ? "active" : ""} href={item.href} key={item.href}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          <button onClick={logout} type="button">
            <LogOut size={18} />
            Logout
          </button>
        </nav>
        <p className="subtle" style={{ marginTop: 24, color: "#bdd1ce", fontSize: 13 }}>
          {session?.admin.email}
        </p>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
