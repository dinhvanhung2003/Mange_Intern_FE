import { useAuth } from "@/hooks/useAuth";
import InternDashboard from "./InternDashboard";
import MentorDashboard from "./MentorDashboard";

export default function DashboardPage() {
  const user = useAuth();

  if (!user) return null;

  return (
    <>
      {user.type === "intern" && <InternDashboard />}
      {user.type === "mentor" && <MentorDashboard />}
    </>
  );
}
