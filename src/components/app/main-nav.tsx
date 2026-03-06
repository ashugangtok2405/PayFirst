'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import {
  LayoutGrid,
  ArrowRightLeft,
  Sparkles,
  Landmark,
  PiggyBank,
  CreditCard,
  FileText,
  Handshake,
} from 'lucide-react'

const overviewItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/dashboard/insights', label: 'Insights', icon: Sparkles },
]

const assetItems = [
  { href: '/dashboard/accounts', label: 'Accounts', icon: Landmark },
  { href: '/dashboard/investments', label: 'Investments', icon: PiggyBank },
]

const liabilityItems = [
    { href: '/dashboard/credit-cards', label: 'Credit Cards', icon: CreditCard },
    { href: '/dashboard/loans', label: 'Loans', icon: FileText },
    { href: '/dashboard/debts', label: 'Debts', icon: Handshake },
]

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleNavClick = (href: string) => {
    router.push(href)
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const renderMenuItems = (items: typeof overviewItems) => {
      return items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            isActive={pathname === item.href}
            tooltip={item.label}
            className="h-11 justify-start"
            onClick={() => handleNavClick(item.href)}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))
  }

  return (
    <>
        <SidebarGroup>
            <SidebarGroupLabel>OVERVIEW</SidebarGroupLabel>
            <SidebarMenu className="p-0">
                {renderMenuItems(overviewItems)}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel>ASSETS</SidebarGroupLabel>
            <SidebarMenu className="p-0">
                {renderMenuItems(assetItems)}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel>LIABILITIES</SidebarGroupLabel>
            <SidebarMenu className="p-0">
                {renderMenuItems(liabilityItems)}
            </SidebarMenu>
        </SidebarGroup>
    </>
  )
}
