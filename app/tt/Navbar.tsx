import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  type FC,
} from "react";
import { List, LucideProps, Play, PlusIcon } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "../routes";
import { IconButton } from "@radix-ui/themes";

type NavItemProps = {
  isActive: boolean;
  item: {
    icon: ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >;
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
    <Link href={href}>
      <IconButton
        variant={isPrimary ? "solid" : "ghost"}
        radius="full"
        size="3"
        title={name}
      >
        <span className="sr-only">{name}</span>
        <Icon size={24} />

        {isActive && (
          <span className="bg-orange-500 rounded-full size-2.5 absolute -bottom-1" />
        )}
      </IconButton>
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
    <nav className="fixed bottom-0 inset-x-0 rounded-t-3xl bg-white md:mx-4">
      <div className="mx-auto flex max-w-md items-center justify-between px-8 py-4">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isActive={false}
            // isActive={router.pathname === item.href}
          />
        ))}
      </div>
    </nav>
  );
};
