'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Settings, LogOut } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import Link from 'next/link'

export function UserNav() {
  const auth = useAuth()
  const { user } = useUser()

  const handleLogout = () => {
    auth.signOut()
  }
  
  const getInitials = (email?: string | null) => {
    if (!email) return 'U'
    return email.substring(0, 2).toUpperCase()
  }

  return (
     <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center gap-3 p-2">
            <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? "User"} />
                <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
            </Avatar>
            <div className="truncate group-data-[collapsible=icon]:hidden">
                <p className="font-semibold text-sm truncate">{user?.displayName ?? 'Ashish'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? 'ashish@example.com'}</p>
            </div>
        </div>
        <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings" className="h-10">
                <Link href="#">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Log out" className="h-10 text-red-500 hover:bg-red-50 hover:text-red-600">
                  <LogOut />
                  <span>Log out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    </div>
  )
}
