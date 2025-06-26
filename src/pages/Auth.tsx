
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
      {/* Lighting effect - back layer only */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-cyan-400/20 via-purple-500/15 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-pink-400/15 via-blue-500/10 to-transparent rounded-full blur-2xl"></div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* RVJ Logo - middle layer */}
          <img 
            src="/lovable-uploads/421f65e3-022b-4c82-ab33-31f0b9ecdf6d.png" 
            alt="RVJ Logo" 
            className="w-[min(85vw,550px)] h-[min(85vh,550px)] object-contain relative z-20"
          />
          
          {/* Form elements positioned precisely over the logo - top layer */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xs">
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Position 1: Sign In text at top */}
                  <div className="text-center -mt-24">
                    <h2 className="text-xl font-bold text-white">Sign In</h2>
                  </div>
                  
                  {/* Position 2: Email and password fields in center area */}
                  <div className="space-y-3 -mt-2">
                    <div className="space-y-2">
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-7 text-sm px-2 w-48 mx-auto"
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
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-7 text-sm px-2 w-48 mx-auto"
                      />
                    </div>
                  </div>
                  
                  {/* Position 3: Sign In button */}
                  <div className="mt-4 flex justify-center">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gradient-to-r from-cyan-500/80 to-purple-600/80 hover:from-cyan-600/90 hover:to-purple-700/90 text-white font-semibold shadow-lg backdrop-blur-md border border-cyan-400/30 h-7 text-sm w-48"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </div>
                  
                  {/* Position 4: Switch to sign up link at bottom */}
                  <div className="mt-8 text-center">
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
                  {/* Position 1: Sign Up text at top */}
                  <div className="text-center -mt-24">
                    <h2 className="text-xl font-bold text-white">Sign Up</h2>
                  </div>
                  
                  {/* Position 2: Name, email, and password fields in center area */}
                  <div className="space-y-2 -mt-1">
                    <div className="space-y-2">
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-7 text-sm px-2 w-48 mx-auto"
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
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-7 text-sm px-2 w-48 mx-auto"
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
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-7 text-sm px-2 w-48 mx-auto"
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
                        className="bg-black/70 border-cyan-400/50 text-white placeholder:text-slate-300 focus:border-cyan-400 focus:ring-cyan-400/30 text-center backdrop-blur-md h-7 text-sm px-2 w-48 mx-auto"
                      />
                    </div>
                  </div>
                  
                  {/* Position 3: Sign Up button */}
                  <div className="mt-3 flex justify-center">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gradient-to-r from-cyan-500/80 to-purple-600/80 hover:from-cyan-600/90 hover:to-purple-700/90 text-white font-semibold shadow-lg backdrop-blur-md border border-cyan-400/30 h-7 text-sm w-48"
                    >
                      {loading ? 'Creating account...' : 'Sign Up'}
                    </Button>
                  </div>
                  
                  {/* Position 4: Switch to sign in link at bottom */}
                  <div className="mt-6 text-center">
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
