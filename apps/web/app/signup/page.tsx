import { redirect } from "next/navigation";

/** Share the audited account form without duplicating its auth logic. */
export default function SignUpPage() {
  redirect("/login?mode=signup");
}
