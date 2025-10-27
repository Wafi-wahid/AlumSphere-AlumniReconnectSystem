import { Home, Users, Heart, Briefcase, Calendar, MessageCircle as MessageCircleIcon, BarChart3 } from "lucide-react";
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
  { id: "community", label: "Community", icon: MessageCircleIcon, roles: ["all"] },
  { id: "messages", label: "Messages", icon: MessageCircleIcon, roles: ["all"] },
  { id: "dashboard", label: "Dashboard", icon: BarChart3, roles: ["admin", "faculty"] },
];

export function Navigation({ activeTab, onTabChange, userRole, className }: NavigationProps) {
  const visibleItems = navigationItems.filter(item => 
    item.roles.includes("all") || item.roles.includes(userRole)
  );

  return (
    <nav className={cn("bg-background border-r", className)}>
      <div className="p-4 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12",
                isActive && "bg-primary text-primary-foreground shadow-sm"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
              
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
      
      {/* Quick Stats */}
      <div className="mt-8 p-4 border-t">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Active Alumni</span>
            <span className="font-medium">2,847</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">This Month</span>
            <span className="font-medium text-success">+18%</span>
          </div>
        </div>
      </div>
    </nav>
  );
}