'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useUser, useAuth, useFirestore, useStorage } from '@/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { Camera } from 'lucide-react'

export function UpdateProfilePhoto() {
  const { user } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const storage = useStorage()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (email?: string | null, name?: string | null) => {
    if (name) return name.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  }
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user || !auth.currentUser) return

    setIsUploading(true)

    try {
      const filePath = `profile-pictures/${user.uid}/${file.name}`
      const storageRef = ref(storage, filePath)

      const snapshot = await uploadBytes(storageRef, file)
      const photoURL = await getDownloadURL(snapshot.ref)

      // Update Firebase Auth
      await updateProfile(auth.currentUser, { photoURL })

      // Update Firestore
      const userDocRef = doc(firestore, 'users', user.uid)
      await updateDoc(userDocRef, { photoURL, updatedAt: new Date().toISOString() })

      toast({ title: 'Profile Picture Updated', description: 'Your new picture has been saved.' })

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message })
    } finally {
      setIsUploading(false)
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative group">
        <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
          <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? "User"} />
          <AvatarFallback className="text-3xl">
            {getInitials(user?.email, user?.displayName)}
          </AvatarFallback>
        </Avatar>
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={handleAvatarClick}
        >
          <Camera className="h-8 w-8 text-white" />
        </div>
      </div>
      <div>
        <Button onClick={handleAvatarClick} disabled={isUploading} type="button">
          {isUploading ? 'Uploading...' : 'Change Picture'}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. 1MB max.</p>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif"
      />
    </div>
  )
}
