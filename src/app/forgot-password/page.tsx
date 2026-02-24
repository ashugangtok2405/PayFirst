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
import loginBackground from '@/images/loginbackground.png'

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
    <div className="flex min-h-screen w-full items-center justify-center lg:justify-end bg-cover bg-center p-4 lg:px-24" style={{ backgroundImage: `url(${loginBackground.src})` }}>
      <Card className="w-full max-w-md bg-black/25 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl">
        <CardHeader className="space-y-2 text-center pt-8">
          <div className="flex justify-center mb-2">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-bold text-white">Reset Your Password</CardTitle>
          <CardDescription className="text-slate-300">
            {emailSent
              ? 'An email has been sent with instructions.'
              : 'Enter your email to receive a password reset link.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {emailSent ? (
            <div className="text-center">
              <p className="text-slate-300 mb-6">
                If you don&apos;t see the email, please check your spam folder.
              </p>
              <Button asChild className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white">
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
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input type="email" placeholder="Email" {...field} className="pl-10 h-12 bg-black/20 border-slate-700 text-white placeholder:text-slate-400 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </Form>
              <div className="mt-8 text-center text-sm text-slate-400">
                <Link href="/" className="font-semibold text-green-400 hover:text-green-300 hover:underline">
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
