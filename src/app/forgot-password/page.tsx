'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/app/logo'
import { useAuth, initiatePasswordReset } from '@/firebase'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const auth = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true)
    try {
      await initiatePasswordReset(auth, data.email)
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your inbox for a link to reset your password.',
      })
      setEmailSent(true)
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.'
      if (error.code === 'auth/user-not-found') {
        description = 'No user found with this email address.'
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl rounded-2xl">
        <CardHeader className="space-y-2 text-center pt-8">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-bold">Reset Your Password</CardTitle>
          <CardDescription className="text-muted-foreground">
            {emailSent
              ? 'An email has been sent with instructions.'
              : 'Enter your email to receive a password reset link.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {emailSent ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-6">
                If you don&apos;t see the email, please check your spam folder.
              </p>
              <Button asChild className="w-full">
                <Link href="/">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input type="email" placeholder="Email" {...field} className="pl-10 h-12" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </Form>
              <Separator className="my-6" />
              <div className="text-center text-sm">
                <Link href="/" className="font-semibold text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
