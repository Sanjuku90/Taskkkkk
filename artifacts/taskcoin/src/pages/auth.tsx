import { PublicLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Button } from "@/components/ui-core";
import { useState } from "react";
import { useLogin, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Welcome back!", description: "Successfully logged in." });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ title: "Login failed", description: error?.message || "Invalid credentials", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <PublicLayout>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl">Welcome Back</CardTitle>
            <p className="text-zinc-400 mt-2">Sign in to manage your investments</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full mt-6" isLoading={loginMutation.isPending}>
                Sign In
              </Button>
              <p className="text-center text-sm text-zinc-400 mt-6">
                Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Create one</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const registerMutation = useRegister({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Account created!", description: "Welcome to TaskCoin." });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ title: "Registration failed", description: error?.message || "Please check your inputs", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    registerMutation.mutate({ data: { username, email, password } });
  };

  return (
    <PublicLayout>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <p className="text-zinc-400 mt-2">Join TaskCoin and start earning</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full mt-6" isLoading={registerMutation.isPending}>
                Create Account
              </Button>
              <p className="text-center text-sm text-zinc-400 mt-6">
                Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
