import { useState } from "react";
import { ChevronDown, Database, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ExpandableSectionProps {
  title: string;
  icon: "database" | "users";
  content: React.ReactNode;
}

export function ExpandableSection({ title, icon, content }: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const IconComponent = icon === "database" ? Database : Users;

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
      >
        <div className="flex items-center">
          <IconComponent className="h-5 w-5 mr-3 text-brand-blue" />
          <h3 className="text-xl font-semibold text-brand-dark">{title}</h3>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {isOpen && (
        <CardContent className="p-6 pt-0 border-t-2 border-black animate-slide-up">
          {content}
        </CardContent>
      )}
    </Card>
  );
}
