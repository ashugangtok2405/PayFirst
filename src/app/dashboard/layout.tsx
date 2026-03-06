'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/firebase'
import { MainNav } from '@/components/app/main-nav'
import { UserNav } from '@/components/app/user-nav'
import { Logo } from '@/components/app/logo'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'
import { PlusCircle, Landmark, CreditCard, FileText, PiggyBank } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AddTransactionDialog } from '@/components/app/add-transaction-dialog'
import { Button } from '@/components/ui/button'
import { AddAccountDialog } from '@/components/app/accounts/add-account-dialog'
import { RecurringProcessor } from '@/components/app/recurring-processor'
import { NotificationBell } from '@/components/app/notifications/notification-bell'
import { AlertManager } from '@/components/app/alert-manager'
import { AddInvestmentDialog } from '@/components/app/investments/add-investment-dialog'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  const pageTitle = useMemo(() => {
    if (pathname === '/dashboard') {
      return 'Dashboard'
    }
    const path = pathname.split('/').pop()?.replace('-', ' ')
    if (!path) {
      return 'Dashboard'
    }
    // Capitalize each word
    return path.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }, [pathname])

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/')
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const getInitials = (email?: string | null) => {
    if (!email) return 'U'
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <SidebarProvider>
      <RecurringProcessor />
      <AlertManager />
      <Sidebar>
        <div className="flex h-full flex-col justify-between">
          <div>
            <SidebarHeader className="border-b border-sidebar-border p-6 pb-4">
              <Logo />
            </SidebarHeader>
            <SidebarContent className="p-0">
              <MainNav />
              <SidebarGroup>
                <SidebarGroupLabel>QUICK ACTIONS</SidebarGroupLabel>
                 <div className="p-2 space-y-2">
                    <AddAccountDialog accountType="bank">
                        <Button variant="outline" className="w-full justify-start">
                        <PlusCircle className="mr-2" /> Add Bank
                        </Button>
                    </AddAccountDialog>
                    <AddAccountDialog accountType="credit">
                        <Button variant="outline" className="w-full justify-start">
                        <CreditCard className="mr-2" /> Add Card
                        </Button>
                    </AddAccountDialog>
                    <AddAccountDialog accountType="loan">
                        <Button variant="outline" className="w-full justify-start">
                        <FileText className="mr-2" /> Add Loan
                        </Button>
                    </AddAccountDialog>
                    <AddInvestmentDialog>
                      <Button variant="outline" className="w-full justify-start">
                        <PiggyBank className="mr-2" /> Add Investment
                      </Button>
                    </AddInvestmentDialog>
                </div>
              </SidebarGroup>
            </SidebarContent>
          </div>
          <SidebarFooter className="p-4">
            <UserNav />
          </SidebarFooter>
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6 lg:px-8">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold">{pageTitle}</h1>
          <div className="ml-auto flex items-center gap-4">
            <AddTransactionDialog>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </AddTransactionDialog>
            <NotificationBell />
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? "User"} />
              <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
