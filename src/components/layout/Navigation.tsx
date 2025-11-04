import { Home, Users, Heart, Briefcase, Calendar, MessageSquare, Megaphone, BarChart3, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
  className?: string;
}

const navigationItems = [
  { id: "home", label: "Home", icon: Home, roles: ["all"] },
  { id: "directory", label: "Directory", icon: Users, roles: ["all"] },
  { id: "mentorship", label: "Mentorship", icon: Heart, roles: ["student", "alumni", "faculty"] },
  { id: "careers", label: "Careers", icon: Briefcase, roles: ["all"] },
  { id: "events", label: "Events", icon: Calendar, roles: ["all"] },
  { id: "community", label: "Community", icon: Megaphone, roles: ["all"] },
  { id: "messages", label: "Messages", icon: MessageSquare, roles: ["all"] },
  { id: "fame", label: "Wall of Fame", icon: Award, roles: ["all"] },
  { id: "dashboard", label: "Dashboard", icon: BarChart3, roles: ["admin", "super_admin", "faculty"] },
];

export function Navigation({ activeTab, onTabChange, userRole, className }: NavigationProps) {
  const visibleItems = navigationItems.filter(item => 
    item.roles.includes("all") || item.roles.includes(userRole)
  );

  return (
    <nav className={cn("bg-transparent", className)}>
      {/* Sidebar pill: within page height, expands to show labels on hover */}
      <div className="group/sidebar my-4 h-[88vh] w-16 hover:w-48 transition-all duration-300 ease-out rounded-2xl p-2 overflow-hidden bg-[linear-gradient(to_bottom,#0b1b3a,#1e3a8a)] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex flex-col justify-center gap-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-12 group relative overflow-hidden",
                isActive && "bg-[#1e3a8a] hover:bg-[#1e3a8a] text-white shadow-sm",
                !isActive && "hover:bg-white/10",
                "focus-visible:ring-[#1e3a8a] focus-visible:ring-2 focus-visible:ring-offset-0"
              )}
              onClick={() => onTabChange(item.id)}
            >
              {/* Active indicator bar */}
              <span
                className={cn(
                  "absolute left-0 top-0 h-full w-1 bg-[#1e3a8a] origin-top transition-transform duration-200",
                  isActive ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
                )}
              />
              <Icon className="h-5 w-5 text-white" />
              {/* Expanding label, revealed when sidebar widens */}
              <span className="ml-3 whitespace-nowrap text-sm text-white/95 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                {item.label}
              </span>
              
              {/* Show notification badges for specific items */}
              {item.id === "mentorship" && userRole === "student" && (
                <Badge variant="secondary" className="ml-auto">
                  3
                </Badge>
              )}
              {item.id === "careers" && (
                <Badge variant="secondary" className="ml-auto">
                  12
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}