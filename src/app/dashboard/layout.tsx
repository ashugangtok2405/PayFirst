'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { PlusCircle, Landmark, CreditCard, FileText, Handshake } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AddTransactionDialog } from '@/components/app/add-transaction-dialog'
import { Button } from '@/components/ui/button'
import { AddAccountDialog } from '@/components/app/accounts/add-account-dialog'
import { RecurringProcessor } from '@/components/app/recurring-processor'
import { NotificationBell } from '@/components/app/notifications/notification-bell'
import { AlertManager } from '@/components/app/alert-manager'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const router = useRouter()

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
            <SidebarContent className="p-4">
              <MainNav />
            </SidebarContent>
          </div>
          <SidebarFooter className="space-y-4 p-4">
            <div className="space-y-2">
              <AddAccountDialog accountType="bank">
                <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md transition hover:scale-[1.02]">
                  <Landmark className="mr-2" /> Add Bank Account
                </Button>
              </AddAccountDialog>
              <AddAccountDialog accountType="credit">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <CreditCard className="mr-2" /> Add Credit Card
                </Button>
              </AddAccountDialog>
              <AddAccountDialog accountType="loan">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <FileText className="mr-2" /> Add Loan / EMI
                </Button>
              </AddAccountDialog>
              <AddAccountDialog accountType="personal_debt">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <Handshake className="mr-2" /> Add Personal Debt
                </Button>
              </AddAccountDialog>
            </div>
            <SidebarSeparator />
            <UserNav />
          </SidebarFooter>
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6 lg:px-8">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold">Dashboard</h1>
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
