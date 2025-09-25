import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Settings, LogOut } from "lucide-react";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
};

export default function TeacherSidebar({
  collapsed,
  onToggle,
  onOpenSettings,
  onSignOut,
}: Props) {
  return (
    <aside
      className={cn(
        "h-[calc(100vh-4rem)] sticky top-16 rounded-r-xl border-r bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              collapsed && "justify-center"
            )}
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Collapse</span>
              </div>
            )}
          </Button>
        </div>

        <div className="mt-auto p-2 space-y-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              collapsed && "justify-center"
            )}
            onClick={onOpenSettings}
          >
            <Settings className={cn("h-5 w-5", !collapsed && "mr-2")} />
            {!collapsed && <span className="text-sm">Settings</span>}
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-red-600 hover:text-red-700",
              collapsed && "justify-center"
            )}
            onClick={onSignOut}
          >
            <LogOut className={cn("h-5 w-5", !collapsed && "mr-2")} />
            {!collapsed && <span className="text-sm">Sign out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}