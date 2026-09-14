import { Suspense } from "react";
import { AuthForm } from "@/components/ui/AuthForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
