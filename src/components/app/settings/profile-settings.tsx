'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth, useUser, useFirestore } from '@/firebase'
import { useToast } from '@/hooks/use-toast'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { useState, useEffect } from 'react'
import { UpdateProfilePhoto } from './update-profile-photo'

const profileSchema = z.object({
  displayName: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfileSettings() {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      email: user?.email ?? '',
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName ?? '',
        email: user.email ?? '',
      })
    }
  }, [user, form.reset])

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true)
    if (!user || !auth.currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' })
      setIsSubmitting(false)
      return
    }

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: data.displayName })
      // Force a reload of the user to get the latest profile data, which triggers onAuthStateChanged
      await auth.currentUser.reload();

      // Update Firestore profile
      const userDocRef = doc(firestore, 'users', user.uid)
      await updateDoc(userDocRef, {
        displayName: data.displayName,
        updatedAt: new Date().toISOString(),
      })

      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>This is how others will see you on the site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <UpdateProfilePhoto />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting || isUserLoading}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
