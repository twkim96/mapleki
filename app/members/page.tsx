import MembersClient from "./MembersClient";
import { cookies } from "next/headers";

export default async function MembersPage() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('mapleki-session');

  return <MembersClient isLoggedIn={isLoggedIn} />;
}
