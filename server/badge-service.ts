import type { Badge, UserBadge, UserStats, InsertUserStats } from "@shared/schema";

export interface BadgeProgress {
  badgeId: number;
  progress: number;
  target: number;
  earned: boolean;
}

export interface UserBadgeData extends UserBadge {
  badge: Badge;
}

export class BadgeService {
  // Predefined political knowledge badges
  private static readonly PREDEFINED_BADGES: Omit<Badge, 'id' | 'createdAt'>[] = [
    {
      name: "First Steps",
      description: "Read your first political article",
      icon: "👋",
      category: "engagement",
      rarity: "common",
      criteria: { articlesRead: 1 },
      points: 10
    },
    {
      name: "News Explorer",
      description: "Read 10 political articles",
      icon: "📰",
      category: "engagement",
      rarity: "common",
      criteria: { articlesRead: 10 },
      points: 25
    },
    {
      name: "Political Scholar",
      description: "Read 50 political articles",
      icon: "🎓",
      category: "engagement",
      rarity: "rare",
      criteria: { articlesRead: 50 },
      points: 100
    },
    {
      name: "Research Pioneer",
      description: "Generate your first research report",
      icon: "🔬",
      category: "research",
      rarity: "common",
      criteria: { researchReportsGenerated: 1 },
      points: 20
    },
    {
      name: "Analysis Expert",
      description: "Generate 10 research reports",
      icon: "📊",
      category: "research",
      rarity: "rare",
      criteria: { researchReportsGenerated: 10 },
      points: 75
    },
    {
      name: "Policy Hunter",
      description: "Generate 25 research reports",
      icon: "🎯",
      category: "research",
      rarity: "epic",
      criteria: { researchReportsGenerated: 25 },
      points: 150
    },
    {
      name: "Speed Reader",
      description: "Spend 2 hours reading political content",
      icon: "⚡",
      category: "knowledge",
      rarity: "common",
      criteria: { totalReadingTime: 120 },
      points: 30
    },
    {
      name: "Marathon Reader",
      description: "Spend 10 hours reading political content",
      icon: "🏃",
      category: "knowledge",
      rarity: "rare",
      criteria: { totalReadingTime: 600 },
      points: 80
    },
    {
      name: "Daily Citizen",
      description: "Maintain a 7-day reading streak",
      icon: "🌟",
      category: "consistency",
      rarity: "rare",
      criteria: { streakDays: 7 },
      points: 60
    },
    {
      name: "Political Devotee",
      description: "Maintain a 30-day reading streak",
      icon: "🔥",
      category: "consistency",
      rarity: "epic",
      criteria: { streakDays: 30 },
      points: 200
    },
    {
      name: "Well-Rounded",
      description: "Explore 5 different political categories",
      icon: "🌈",
      category: "diversity",
      rarity: "rare",
      criteria: { categoriesExplored: 5 },
      points: 90
    },
    {
      name: "Rising Star",
      description: "Reach level 5",
      icon: "⭐",
      category: "progression",
      rarity: "epic",
      criteria: { level: 5 },
      points: 120
    },
    {
      name: "Political Elite",
      description: "Reach level 10",
      icon: "👑",
      category: "progression",
      rarity: "legendary",
      criteria: { level: 10 },
      points: 300
    },
    {
      name: "Knowledge Seeker",
      description: "Accumulate 500 total points",
      icon: "💎",
      category: "achievement",
      rarity: "epic",
      criteria: { totalPoints: 500 },
      points: 0
    },
    {
      name: "Political Master",
      description: "Accumulate 1000 total points",
      icon: "🏆",
      category: "achievement",
      rarity: "legendary",
      criteria: { totalPoints: 1000 },
      points: 0
    }
  ];

  static getBadgeIcon(rarity: string): string {
    switch (rarity) {
      case 'common': return '🥉';
      case 'rare': return '🥈';
      case 'epic': return '🥇';
      case 'legendary': return '💎';
      default: return '🏅';
    }
  }

  static getBadgeColor(rarity: string): string {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100 border-gray-300';
      case 'rare': return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'epic': return 'text-purple-700 bg-purple-100 border-purple-300';
      case 'legendary': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  }

  static calculateLevel(totalPoints: number): number {
    // Level formula: sqrt(points / 100) + 1
    return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
  }

  static getPointsForNextLevel(currentLevel: number): number {
    // Points needed for next level
    return Math.pow(currentLevel, 2) * 100;
  }

  static checkBadgeEligibility(userStats: UserStats, badge: Badge): boolean {
    const criteria = badge.criteria as any;
    
    // Check each criterion
    for (const [key, requiredValue] of Object.entries(criteria)) {
      const userValue = userStats[key as keyof UserStats];
      
      if (key === 'categoriesExplored') {
        const categories = Array.isArray(userStats.categoriesExplored) 
          ? userStats.categoriesExplored 
          : [];
        if (categories.length < (requiredValue as number)) {
          return false;
        }
      } else if (typeof userValue === 'number' && userValue < (requiredValue as number)) {
        return false;
      }
    }
    
    return true;
  }

  static getProgressTowardsBadge(userStats: UserStats, badge: Badge): BadgeProgress {
    const criteria = badge.criteria as any;
    let progress = 0;
    let target = 1;
    
    // For single criterion badges, show progress
    const criteriaKeys = Object.keys(criteria);
    if (criteriaKeys.length === 1) {
      const key = criteriaKeys[0];
      const requiredValue = criteria[key] as number;
      
      if (key === 'categoriesExplored') {
        const categories = Array.isArray(userStats.categoriesExplored) 
          ? userStats.categoriesExplored 
          : [];
        progress = categories.length;
        target = requiredValue;
      } else {
        const userValue = userStats[key as keyof UserStats] as number;
        progress = userValue || 0;
        target = requiredValue;
      }
    }
    
    const earned = this.checkBadgeEligibility(userStats, badge);
    
    return {
      badgeId: badge.id,
      progress: Math.min(progress, target),
      target,
      earned
    };
  }

  static getPredefinedBadges(): Omit<Badge, 'id' | 'createdAt'>[] {
    return [...this.PREDEFINED_BADGES];
  }

  static updateUserStats(
    currentStats: UserStats, 
    updates: Partial<InsertUserStats>
  ): UserStats {
    const updatedStats = { ...currentStats, ...updates };
    
    // Recalculate level based on total points
    updatedStats.level = this.calculateLevel(updatedStats.totalPoints);
    
    // Update timestamp
    updatedStats.updatedAt = new Date();
    
    return updatedStats;
  }
}

export const badgeService = new BadgeService();