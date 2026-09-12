import { Clock } from "@/components/ui/Clock";

export function TopBar() {
  return (
    <header className="mb-10">
      <div className="flex justify-end">
        <Clock />
      </div>
      <div className="rule mt-3" />
    </header>
  );
}
