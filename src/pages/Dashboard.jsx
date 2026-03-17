import { useProfile } from "@/lib/ProfileContext";
import TraderDashboard from "./dashboard/TraderDashboard";
import DronePilotDashboard from "./dashboard/DronePilotDashboard";
import StartupDashboard from "./dashboard/StartupDashboard";
import EliteHumanDashboard from "./dashboard/EliteHumanDashboard";

const DASHBOARD_MAP = {
  trader: TraderDashboard,
  drone_pilot: DronePilotDashboard,
  startup: StartupDashboard,
  elite_human: EliteHumanDashboard,
};

export default function Dashboard() {
  const { activeProfileId } = useProfile();
  const Component = DASHBOARD_MAP[activeProfileId];
  if (!Component) return null;
  return <Component />;
}