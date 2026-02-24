'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, PiggyBank } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/app/logo'
import { useAuth, useUser, initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
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

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isUserLoading, router])
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await initiateEmailSignIn(auth, data.email, data.password)
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.'
      if (error.code === 'auth/invalid-credential') {
        description = 'Invalid email or password. Please try again.'
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
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
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center lg:justify-end bg-cover bg-center p-4 lg:px-24" style={{ backgroundImage: `url(${loginBackground.src})` }}>
      <Card className="w-full max-w-md bg-black/25 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl">
        <CardHeader className="space-y-2 text-center pt-8">
          <div className="flex justify-center mb-2">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-bold text-white">Login to Your Account</CardTitle>
          <CardDescription className="text-slate-300">Take control of every rupee.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Password" 
                          {...field} 
                          className="pl-10 h-12 pr-10 bg-black/20 border-slate-700 text-white placeholder:text-slate-400 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:bg-transparent hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                      </div>
                    </FormControl>
                    <div className="text-right pt-1">
                        <Link href="/forgot-password" className="text-sm font-medium text-slate-300 hover:text-white hover:underline">
                          Forgot Password?
                        </Link>
                    </div>
                    <FormMessage className="pt-1" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900/50 px-2 text-slate-400" style={{background: 'rgb(0 0 0 / 0.25)'}}>OR CONTINUE WITH</span>
            </div>
          </div>
          
          <Button variant="outline" className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300" onClick={handleGoogleSignIn} disabled={isSubmitting}>
            <GoogleIcon className="mr-2 h-6 w-6" />
            Continue with Google
          </Button>
          
          <div className="mt-8 space-y-4 text-sm text-slate-200">
            <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span>Secure | Smart Tracking</span>
            </div>
            <div className="flex items-center gap-3">
                <PiggyBank className="w-5 h-5 text-green-400" />
                <span>Automated Savings</span>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-green-400 hover:text-green-300 hover:underline">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
