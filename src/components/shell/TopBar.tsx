import { Clock } from "@/components/ui/Clock";
import { AuthControls } from "@/lib/auth-ui";

export function TopBar() {
  return (
    <header className="mb-10">
      <div className="flex items-center justify-end gap-8">
        <Clock />
        <AuthControls />
      </div>
      <div className="rule-double mt-3" />
    </header>
  );
}
