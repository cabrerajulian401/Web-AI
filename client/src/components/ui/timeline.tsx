import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TimelineItem } from "@shared/schema";

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <Card className="shadow-card p-6">
      <h3 className="text-xl font-semibold text-brand-dark mb-6 flex items-center">
        <Clock className="h-5 w-5 mr-2 text-brand-blue" />
        Timeline
      </h3>
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id} className="relative pl-8">
            <div className="absolute left-0 top-1 w-3 h-3 bg-brand-blue rounded-full" />
            {index < items.length - 1 && (
              <div className="absolute left-1.5 top-4 w-0.5 h-16 bg-gray-200" />
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="font-medium text-brand-dark">
                  {new Date(item.date).toLocaleDateString()}
                </span>
                <span className="text-muted">•</span>
                <a 
                  href="#" 
                  className="text-brand-blue hover:underline font-medium"
                  onClick={(e) => e.preventDefault()}
                >
                  {item.sourceLabel}
                </a>
              </div>
              <h4 className="font-medium text-brand-dark">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
