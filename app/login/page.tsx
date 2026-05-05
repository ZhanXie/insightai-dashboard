"use client";

import { useFormStatus } from "react-dom";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const reason = searchParams.get("reason");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showSessionAlert, setShowSessionAlert] = useState(false);

  useEffect(() => {
    if (reason === "session_expired") {
      setShowSessionAlert(true);
    }
  }, [reason]);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setPending(true);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码错误");
        setPending(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("发生错误，请重试");
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}
          <form action={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
              />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>

      <AlertDialog open={showSessionAlert} onOpenChange={setShowSessionAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>会话已失效</AlertDialogTitle>
            <AlertDialogDescription>
              您的登录会话已过期或账户信息在数据库中不存在。这可能是由于系统更新或数据库维护导致。请重新登录以继续访问。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSessionAlert(false)}>
              我知道了
            </AlertDialogAction>
            <Button variant="outline" asChild>
              <Link href="/register">注册新账户</Link>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background" />
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
