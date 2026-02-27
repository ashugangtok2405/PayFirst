'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/app/logo'
import { useAuth, useUser, initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase'
import { Form, FormControl, FormField, FormMessage, FormItem } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import loginBackground from '@/images/loginbackground.png'

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.139,44,30.024,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

const signupSchema = z
  .object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isUserLoading, router])

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      await initiateEmailSignUp(auth, data.email, data.password)
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.'
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email address is already in use.'
        form.setError('email', { type: 'manual', message: description });
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description,
      })
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/popup-closed-by-user') {
        description = 'The sign-in window was closed. Please try again.';
      } else if (error.code === 'auth/operation-not-allowed') {
        description = 'Google Sign-In is not enabled for this app. Please contact support.';
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description,
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isUserLoading || user) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 p-4">
            <p className="text-white">Loading...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Image
        src={loginBackground}
        alt="Background"
        fill
        className="object-cover z-0"
        priority
      />
      <Card className="relative w-full max-w-lg rounded-3xl bg-white/10 backdrop-blur-xl border-2 border-white/20 shadow-[0_0_60px_rgba(59,130,246,0.6)]">
        <CardContent className="p-8 sm:p-12 space-y-8">
          <div className="flex justify-center">
            <Logo />
          </div>

          <div className='space-y-2'>
            <h2 className="text-2xl font-bold text-white text-center">Create Your Account</h2>
            <p className="text-gray-300 text-center">Start your journey to financial freedom.</p>
          </div>
          
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                     <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Password" 
                          {...field} 
                          className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-300 hover:bg-transparent hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                        <Input 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="Confirm Password" 
                          {...field} 
                          className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
                        />
                         <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-300 hover:bg-transparent hover:text-white"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] transition duration-300" disabled={isSubmitting}>
                {isSubmitting ? 'Signing up...' : 'Sign Up'}
              </Button>
            </form>
          </Form>

          <div className="space-y-6">
            <div className="flex items-center">
              <div className="flex-grow h-px bg-white/20"></div>
              <span className="px-3 text-gray-300 text-sm">OR CONTINUE WITH</span>
              <div className="flex-grow h-px bg-white/20"></div>
            </div>
            
            <Button variant="outline" className="w-full py-3 rounded-xl bg-white/20 text-white font-medium border-0 hover:bg-white/30 transition duration-300" onClick={handleGoogleSignIn} disabled={isSubmitting}>
              <GoogleIcon className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>
          </div>

          <div className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/" className="font-semibold text-green-400 hover:text-green-300 hover:underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
