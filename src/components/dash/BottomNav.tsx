import { IconBox, IconHome, IconPlus, IconShop } from "../Icons";

export type Tab = "Home" | "Products" | "Form" | "Profile";
const ITEMS: [Tab, string, React.ReactNode, boolean][] = [["Home", "Home", <IconHome key="h" />, false], ["Products", "Products", <IconBox key="b" />, false], ["Form", "Add", <IconPlus key="p" size={28} />, true], ["Profile", "My shop", <IconShop key="s" />, false]];

export default function BottomNav({ tab, onTab, settings = true }: { tab: Tab; onTab: (t: Tab) => void; settings?: boolean }) {
  return (
    <nav className="dnav" aria-label="Dashboard">
      {ITEMS.filter(([k]) => settings || k !== "Profile").map(([k, label, icon, plus]) => (
        <button key={k} className="dn" aria-current={tab === k} onClick={() => onTab(k)}>
          <span className={plus ? "pl" : ""}>{icon}</span>{label}
        </button>
      ))}
    </nav>
  );
}
