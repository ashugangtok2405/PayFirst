'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import {
  LayoutGrid,
  ArrowRightLeft,
  Wallet,
  Sparkles,
  Settings,
} from 'lucide-react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/dashboard/accounts', label: 'Accounts', icon: Wallet },
  { href: '/dashboard/insights', label: 'Insights', icon: Sparkles },
]

export function MainNav() {
  const pathname = usePathname()

  return (
      <SidebarMenu className="flex-1 p-0">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
              className="h-12 justify-start data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500 data-[active=true]:to-indigo-600 data-[active=true]:text-white data-[active=true]:shadow-md"
            >
              <Link href={item.href}>
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
  )
}
