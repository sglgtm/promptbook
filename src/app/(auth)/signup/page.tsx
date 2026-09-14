import { Suspense } from "react";
import { AuthForm } from "@/components/ui/AuthForm";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
