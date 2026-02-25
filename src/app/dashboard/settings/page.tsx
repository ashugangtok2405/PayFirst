import { ProfileSettings } from '@/components/app/settings/profile-settings'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>
      <Separator />
      <div className="max-w-2xl mx-auto">
        <ProfileSettings />
      </div>
    </div>
  )
}
