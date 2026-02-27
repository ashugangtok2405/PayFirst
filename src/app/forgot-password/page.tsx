'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/app/logo'
import { useAuth, initiatePasswordReset } from '@/firebase'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { PlaceHolderImages } from '@/lib/placeholder-images'

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const auth = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const authBg = PlaceHolderImages.find(p => p.id === 'auth-background');

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
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {authBg && (
        <Image
          src={authBg.imageUrl}
          alt={authBg.description}
          data-ai-hint={authBg.imageHint}
          fill
          className="object-cover z-0"
        />
      )}
      <Card className="relative w-full max-w-lg rounded-3xl bg-white/10 backdrop-blur-xl border-2 border-white/20 shadow-[0_0_60px_rgba(59,130,246,0.6)]">
        <CardContent className="p-8 sm:p-12 space-y-8">
            <div className="flex justify-center">
                <Logo />
            </div>

            <div className='space-y-2'>
              <h2 className="text-2xl font-bold text-white text-center">Reset Your Password</h2>
              <p className="text-gray-300 text-center">
                {emailSent
                  ? "If you don't see the email, please check your spam folder."
                  : 'Enter your email to receive a password reset link.'}
              </p>
            </div>

          {emailSent ? (
            <div className="text-center">
              <Button asChild className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] transition duration-300">
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
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                            <Input 
                              type="email" 
                              placeholder="Email" 
                              {...field} 
                              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] transition duration-300" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </Form>
              <div className="mt-8 text-center text-sm text-gray-400">
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
