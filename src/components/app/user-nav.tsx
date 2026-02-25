'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
    <div className="rounded-2xl bg-secondary/50 p-4 shadow-sm">
        <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? "User"} />
                <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
            </Avatar>
            <div className="truncate">
                <p className="truncate text-sm font-semibold text-foreground">{user?.displayName ?? 'Ashish'}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email ?? 'ashish@example.com'}</p>
            </div>
        </div>

        <div className="mt-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start bg-background text-sm text-foreground/80 hover:bg-muted">
                <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>

            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-sm text-red-500 hover:bg-red-50 hover:text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Log out
            </Button>
        </div>
    </div>
  )
}
