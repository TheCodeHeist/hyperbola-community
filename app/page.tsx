import {
  RedirectToSignIn,
  SignedIn,
  UserButton,
} from "@daveyplate/better-auth-ui";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  redirect("/dashboard");
}
