import { ProfileSettings } from '@/components/app/settings/profile-settings'
import { CategorySettings } from '@/components/app/settings/category-settings'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and categories.</p>
      </div>
      <Separator />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <ProfileSettings />
        <CategorySettings />
      </div>
    </div>
  )
}
