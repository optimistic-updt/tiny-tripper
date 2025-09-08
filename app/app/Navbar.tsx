import React, { type FC, type ReactNode } from "react";
import { List, Play, PlusIcon } from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { ROUTES } from "../routes";

type NavItemProps = {
  isActive: boolean;
  item: {
    icon: ReactNode;
    name: string;
    href: string;
    isPrimary?: boolean;
  };
};

const NavItem: FC<NavItemProps> = ({
  isActive,
  item: { icon, name, href, isPrimary },
}) => {
  const Icon = icon;
  return (
    <Link
      href={href}
      className={twMerge(
        "relative rounded-full p-2 text-gray-400 transition-colors",
        isPrimary && "bg-purple-600 text-white",
        isActive && "text-gray-9050",
      )}
    >
      <span className="sr-only">{name}</span>
      {/* @ts-expect-error - TypeScript doesn't know about Lucide */}
      <Icon size={24} />
    </Link>
  );
};

const NAV_ITEMS = [
  { name: "Home", href: ROUTES.play, icon: Play },
  { name: "Plus", href: ROUTES.newActivity, icon: PlusIcon, isPrimary: true },
  { name: "Blocks", href: ROUTES.activities, icon: List },
];

export const Navbar = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 rounded-t-3xl bg-white md:mx-4">
      <div className="mx-auto flex max-w-md items-center justify-between px-8 py-4">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            // isActive={router.pathname === item.href}
          />
        ))}
      </div>
    </nav>
  );
};
