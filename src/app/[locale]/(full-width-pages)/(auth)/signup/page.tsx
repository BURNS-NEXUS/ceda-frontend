import SignUpForm from "@/components/others/auth/sign-up";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account | CEDA Innovation Portal",
  description: "Create a CEDA Innovation Portal account",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
