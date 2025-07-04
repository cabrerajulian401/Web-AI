import { useState } from "react";
import { ChevronDown, Database, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ExpandableSectionProps {
  title: string;
  icon: "database" | "users" | "conflict" | "pivot";
  content: React.ReactNode;
  customIcon?: string;
}

export function ExpandableSection({ title, icon, content, customIcon }: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const renderIcon = () => {
    if (customIcon) {
      return (
        <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center mr-3">
          <img 
            src={customIcon} 
            alt={title} 
            className="h-5 w-5 object-contain"
          />
        </div>
      );
    }
    
    const IconComponent = icon === "database" ? Database : Users;
    return <IconComponent className="h-5 w-5 mr-3 text-brand-blue" />;
  };

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
      >
        <div className="flex items-center">
          {renderIcon()}
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
