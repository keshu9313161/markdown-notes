import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, LogOut, Moon, Sun, UserPen } from "lucide-react";
import { useTheme } from "next-themes";

export function ProfileFooter({
  name,
  onEditProfile,
  onLogout,
  sidebarOpen,
}: {
  name: string;
  onEditProfile: () => void;
  onLogout: () => void;
  sidebarOpen: boolean;
}) {
  const collapsed = !sidebarOpen;
  const initial = name.charAt(0).toUpperCase();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const trigger = collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center p-1.5 rounded-md hover:bg-sidebar-accent/50 transition-colors"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs font-medium bg-sidebar-accent text-sidebar-accent-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={6}>
        {name}
      </TooltipContent>
    </Tooltip>
  ) : (
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors text-left"
      >
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs font-medium bg-sidebar-accent text-sidebar-accent-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
        <span className="flex-1 min-w-0 text-sm font-medium text-sidebar-foreground truncate">
          {name}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
  );

  return (
    <div
      className={cn(
        "shrink-0 border-t border-sidebar-border",
        collapsed ? "flex justify-center py-1.5" : "p-1.5",
      )}
    >
      <DropdownMenu>
        {trigger}
        <DropdownMenuContent
          side={collapsed ? "right" : "top"}
          align={collapsed ? "end" : "start"}
          className="w-48"
        >
          <DropdownMenuLabel className="font-normal text-xs text-muted-foreground truncate">
            Welcome, {name}!
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onEditProfile}>
            <UserPen className="h-4 w-4" />
            Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {isDark ? "Light mode" : "Dark mode"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
