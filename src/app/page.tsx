import { redirect } from "next/navigation";

// The app root sends you into the app: signed-in users reach the dashboard;
// everyone else is bounced to /login by the dashboard's auth gate.
export default function Home() {
  redirect("/dashboard");
}
