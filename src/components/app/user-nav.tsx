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

export function UserNav() {
  const { state } = useSidebar()
  const avatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-full justify-start gap-2 px-2 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatar?.imageUrl} alt="@shadcn" data-ai-hint={avatar?.imageHint} />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
           <div className="truncate group-data-[collapsible=icon]:hidden">
            <p className="font-medium text-sm text-start truncate">John Doe</p>
            <p className="text-xs text-muted-foreground text-start truncate">john.doe@example.com</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">John Doe</p>
            <p className="text-xs leading-none text-muted-foreground">
              john.doe@example.com
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
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
