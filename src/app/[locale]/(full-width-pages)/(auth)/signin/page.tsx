import SignIn from "@/components/others/auth/sign-in";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | CEDA Innovation Portal",
  description: "Sign in to the CEDA Innovation Portal",
};

export default function SignInPage() {
  return <SignIn />;
}
