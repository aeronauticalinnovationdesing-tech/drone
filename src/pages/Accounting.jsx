import { useProfile } from "@/lib/ProfileContext";
import TraderAccounting from "./trader/TraderAccounting";
import GenericAccounting from "./shared/GenericAccounting";

const PAGE_MAP = {
  trader: TraderAccounting,
  drone_pilot: GenericAccounting,
  startup: GenericAccounting,
  elite_human: GenericAccounting,
};

export default function Accounting() {
  const { activeProfileId } = useProfile();
  const Component = PAGE_MAP[activeProfileId] || GenericAccounting;
  return <Component />;
}