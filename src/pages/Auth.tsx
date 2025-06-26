
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
    } else {
      toast.success('Signed in successfully!');
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
    } else {
      toast.success('Account created successfully! Please check your email to verify your account.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl opacity-50"></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-32 w-1 h-1 bg-pink-400/60 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 left-32 w-3 h-3 bg-purple-400/60 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 right-20 w-1 h-1 bg-cyan-400/60 rounded-full animate-pulse delay-1500"></div>
      </div>

      {/* Main content container with logo and overlaid form */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Lighting effect behind the logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[min(85vw,550px)] h-[min(85vh,550px)] bg-gradient-radial from-cyan-400/30 via-purple-500/20 to-transparent rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute w-[min(70vw,450px)] h-[min(70vh,450px)] bg-gradient-radial from-pink-400/25 via-blue-500/15 to-transparent rounded-full blur-xl animate-pulse delay-1000"></div>
          </div>
          
          {/* RVJ Logo scaled to fit screen without scrolling */}
          <img 
            src="/lovable-uploads/421f65e3-022b-4c82-ab33-31f0b9ecdf6d.png" 
            alt="RVJ Logo" 
            className="w-[min(85vw,550px)] h-[min(85vh,550px)] object-contain relative z-10"
          />
          
          {/* Form elements positioned precisely over the logo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xs">
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Sign In text positioned at top */}
                  <div className="text-center mb-8 -mt-20">
                    <h2 className="text-2xl font-bold text-white">Sign In</h2>
                  </div>
                  
                  {/* Email and password fields positioned in center area */}
                  <div className="space-y-3 -mt-4">
                    <div className="space-y-2">
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-8 text-sm px-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-8 text-sm px-3"
                      />
                    </div>
                  </div>
                  
                  {/* Sign In button positioned over silver bezel area */}
                  <div className="mt-6">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-cyan-500/80 to-purple-600/80 hover:from-cyan-600/90 hover:to-purple-700/90 text-white font-semibold shadow-lg backdrop-blur-md border border-cyan-400/30 h-8 text-sm"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </div>
                  
                  {/* Switch to sign up link positioned at bottom */}
                  <div className="mt-12 text-center">
                    <p className="text-slate-300 text-xs">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('signup')}
                        className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                      >
                        Sign up here
                      </button>
                    </p>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-3">
                <form onSubmit={handleSignUp} className="space-y-3">
                  {/* Sign Up text positioned at top */}
                  <div className="text-center mb-6 -mt-20">
                    <h2 className="text-2xl font-bold text-white">Sign Up</h2>
                  </div>
                  
                  {/* Name, email, and password fields positioned in center area */}
                  <div className="space-y-2 -mt-2">
                    <div className="space-y-2">
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-8 text-sm px-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-8 text-sm px-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-8 text-sm px-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-8 text-sm px-3"
                      />
                    </div>
                  </div>
                  
                  {/* Sign Up button positioned over silver bezel area */}
                  <div className="mt-4">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-cyan-500/80 to-purple-600/80 hover:from-cyan-600/90 hover:to-purple-700/90 text-white font-semibold shadow-lg backdrop-blur-md border border-cyan-400/30 h-8 text-sm"
                    >
                      {loading ? 'Creating account...' : 'Sign Up'}
                    </Button>
                  </div>
                  
                  {/* Switch to sign in link positioned at bottom */}
                  <div className="mt-8 text-center">
                    <p className="text-slate-300 text-xs">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('signin')}
                        className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
