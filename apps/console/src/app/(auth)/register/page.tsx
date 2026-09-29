import { RegisterForm } from "./RegisterForm";

/**
 * Lot 3 Auth (design handoff): inscription. Campaign/source params arriving
 * from the Website (01_Specifications_Website §5) are carried through as
 * hidden fields so they land in USER_REGISTERED's payload. Stays a Server
 * Component only to read these searchParams — the interactive form itself
 * (RegisterForm) needs to be a Client Component for useActionState.
 */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; campaign?: string }>;
}) {
  const params = await searchParams;
  return <RegisterForm source={params.source ?? ""} campaign={params.campaign ?? ""} />;
}
