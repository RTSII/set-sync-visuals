
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
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
      <div className="relative z-10 w-full max-w-7xl px-6 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* RVJ Logo as background */}
          <img 
            src="/lovable-uploads/87ddeedc-7faa-4e51-bdae-9ab30d1c624f.png" 
            alt="RVJ Logo" 
            className="w-[700px] h-[700px] object-contain opacity-90"
          />
          
          {/* Strategically positioned form fields over the logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Position form in the center-right area of the logo where there's space */}
            <div className="w-80 translate-x-12 translate-y-8">
              <Card className="bg-black/30 border-cyan-400/40 backdrop-blur-md shadow-2xl shadow-cyan-500/25">
                <CardContent className="p-6">
                  <Tabs defaultValue="signin" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-cyan-400/30 mb-6">
                      <TabsTrigger 
                        value="signin" 
                        className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/60 data-[state=active]:to-purple-500/60"
                      >
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup" 
                        className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/60 data-[state=active]:to-purple-500/60"
                      >
                        Sign Up
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin" className="space-y-4">
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email" className="text-slate-200 text-sm font-medium">Email</Label>
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-black/50 border-cyan-400/50 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/30 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signin-password" className="text-slate-200 text-sm font-medium">Password</Label>
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-black/50 border-cyan-400/50 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/30 text-sm"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-cyan-500/25 border-0 transition-all duration-200"
                        >
                          {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-3">
                      <form onSubmit={handleSignUp} className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className="text-slate-200 text-sm font-medium">Full name</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="John Smith"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-black/50 border-cyan-400/50 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/30 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-slate-200 text-sm font-medium">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-black/50 border-cyan-400/50 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/30 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-slate-200 text-sm font-medium">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-black/50 border-cyan-400/50 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/30 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password" className="text-slate-200 text-sm font-medium">Re-enter password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="bg-black/50 border-cyan-400/50 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/30 text-sm"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-cyan-500/25 border-0 transition-all duration-200"
                        >
                          {loading ? 'Creating account...' : 'Sign Up'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
