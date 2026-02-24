'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useSidebar } from "@/components/ui/sidebar"
import { useAuth, useUser } from "@/firebase"

export function UserNav() {
  const { state } = useSidebar()
  const avatar = PlaceHolderImages.find(img => img.id === 'user-avatar');
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-full justify-start gap-2 px-2 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL ?? avatar?.imageUrl} alt={user?.displayName ?? "User"} data-ai-hint={avatar?.imageHint} />
            <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
          </Avatar>
           <div className="truncate group-data-[collapsible=icon]:hidden">
            <p className="font-medium text-sm text-start truncate">{user?.displayName ?? 'User'}</p>
            <p className="text-xs text-muted-foreground text-start truncate">{user?.email}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.displayName ?? 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}