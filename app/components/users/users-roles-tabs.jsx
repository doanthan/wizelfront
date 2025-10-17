"use client";

import { useRouter, usePathname } from "next/navigation";
import { Users, Shield } from "lucide-react";

export default function UsersRolesTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { id: "users", label: "Users", icon: Users, href: "/stores/users" },
    { id: "roles", label: "Roles", icon: Shield, href: "/stores/roles" }
  ];

  const isActive = (href) => pathname === href;

  return (
    <div className="flex gap-2 mt-6 border-b border-gray-200 dark:border-gray-700">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.href)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              isActive(tab.href)
                ? 'border-sky-blue text-sky-blue'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
