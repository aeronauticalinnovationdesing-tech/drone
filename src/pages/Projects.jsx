import { useProfile } from "@/lib/ProfileContext";
import Projects from "./startup/StartupProjects";
import DroneMissions from "./drone_pilot/DroneMissions";
import EliteHumanProjects from "./elite_human/EliteHumanProjects";

const PAGE_MAP = {
  trader: Projects,         // Trader no tiene proyectos en nav, pero por si accede
  drone_pilot: DroneMissions,
  startup: Projects,
  elite_human: EliteHumanProjects,
};

export default function ProjectsRouter() {
  const { activeProfileId } = useProfile();
  const Component = PAGE_MAP[activeProfileId];
  if (!Component) return null;
  return <Component />;
}