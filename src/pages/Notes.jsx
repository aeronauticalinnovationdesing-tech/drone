import { useProfile } from "@/lib/ProfileContext";
import TraderNotes from "./trader/TraderNotes";
import GenericNotes from "./shared/GenericNotes";

// Notes are mostly the same but with different labels/context per profile
const PAGE_MAP = {
  trader: TraderNotes,
  drone_pilot: GenericNotes,
  startup: GenericNotes,
  elite_human: GenericNotes,
};

export default function Notes() {
  const { activeProfileId } = useProfile();
  const Component = PAGE_MAP[activeProfileId] || GenericNotes;
  return <Component />;
}