import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-wellness.jpg";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      navigate("/home");
    } catch (error) {
      console.error("Google login error:", error);
      // You can add toast notification here for error handling
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Implement email/password login
      console.log("Email login:", formData);
      // For now, just navigate to home
      setTimeout(() => {
        navigate("/home");
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Email login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue your wellness journey</p>
          </div>

          {/* Google Login Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full mb-6 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            variant="outline"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <div className="relative mb-6">
            <Separator />
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-500">
              or continue with email
            </span>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <Label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </Label>
              </div>
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary hover:text-primary/80">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
} 