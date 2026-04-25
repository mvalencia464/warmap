import { UserButton } from "@clerk/react";

export function NavActions() {
  return (
    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
      <UserButton appearance={{ elements: { userButtonBox: "ring-0" } }} />
    </div>
  );
}
