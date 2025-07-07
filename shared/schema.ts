import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  readTime: integer("read_time").notNull(),
  sourceCount: integer("source_count").notNull(),
  heroImageUrl: text("hero_image_url").notNull(),
  authorName: text("author_name"),
  authorTitle: text("author_title"),
});

export const executiveSummary = pgTable("executive_summary", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  points: text("points").array().notNull(),
});

export const timelineItems = pgTable("timeline_items", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  date: timestamp("date").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'announcement', 'release', etc.
  sourceLabel: text("source_label").notNull(),
  sourceUrl: text("source_url"),
});

export const relatedArticles = pgTable("related_articles", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  source: text("source").notNull(),
  imageUrl: text("image_url").notNull(),
  url: text("url").notNull(),
});

export const rawFacts = pgTable("raw_facts", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  category: text("category").notNull(),
  facts: text("facts").array().notNull(),
});

export const perspectives = pgTable("perspectives", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  viewpoint: text("viewpoint").notNull(),
  description: text("description").notNull(),
  color: text("color").notNull(), // 'green', 'yellow', 'blue', etc.
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
});

export const insertExecutiveSummarySchema = createInsertSchema(executiveSummary).omit({
  id: true,
});

export const insertTimelineItemSchema = createInsertSchema(timelineItems).omit({
  id: true,
});

export const insertRelatedArticleSchema = createInsertSchema(relatedArticles).omit({
  id: true,
});

export const insertRawFactsSchema = createInsertSchema(rawFacts).omit({
  id: true,
});

export const insertPerspectiveSchema = createInsertSchema(perspectives).omit({
  id: true,
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type ExecutiveSummary = typeof executiveSummary.$inferSelect;
export type InsertExecutiveSummary = z.infer<typeof insertExecutiveSummarySchema>;
export type TimelineItem = typeof timelineItems.$inferSelect;
export type InsertTimelineItem = z.infer<typeof insertTimelineItemSchema>;
export type RelatedArticle = typeof relatedArticles.$inferSelect;
export type InsertRelatedArticle = z.infer<typeof insertRelatedArticleSchema>;
export type RawFacts = typeof rawFacts.$inferSelect;
export type InsertRawFacts = z.infer<typeof insertRawFactsSchema>;
export type Perspective = typeof perspectives.$inferSelect;
export type InsertPerspective = z.infer<typeof insertPerspectiveSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User badges and achievements
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  rarity: varchar("rarity", { length: 20 }).notNull().default("common"), // common, rare, epic, legendary
  criteria: json("criteria").notNull(), // JSON object with requirements
  points: integer("points").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
  progress: json("progress"), // Track progress towards badge if needed
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  articlesRead: integer("articles_read").notNull().default(0),
  researchReportsGenerated: integer("research_reports_generated").notNull().default(0),
  totalReadingTime: integer("total_reading_time").notNull().default(0), // in minutes
  streakDays: integer("streak_days").notNull().default(0),
  lastActiveDate: timestamp("last_active_date").defaultNow(),
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  categoriesExplored: json("categories_explored").notNull().default('[]'), // Array of categories
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true,
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
