"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TestTube } from "lucide-react";
import { useEffect, useState } from "react";

export function Navigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/tester", label: "Model Tester", icon: TestTube },
  ];

  if (!mounted) {
    return (
      <nav className="nav-container">
        <div className="nav-links">
          {links.map(l => (
            <div key={l.href} className="nav-link" style={{ visibility: 'hidden' }}>
              <l.icon size={18} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="nav-container">
      <div className="nav-links">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
