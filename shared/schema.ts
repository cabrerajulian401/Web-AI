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

export const citedSources = pgTable("cited_sources", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., "Government Document", "News Article", "Official Statement"
  description: text("description").notNull(),
  url: text("url"),
  imageUrl: text("image_url").notNull(),
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
  source: text("source"),
  quote: text("quote"),
  color: text("color").notNull(), // 'green', 'yellow', 'blue', etc.
  url: text("url"),
  conflictSource: text("conflict_source"), // The opposing source
  conflictQuote: text("conflict_quote"), // The opposing quote
});

export const conflictingClaims = pgTable("conflicting_claims", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  topic: text("topic").notNull(),
  conflict: text("conflict").notNull(),
  sourceA_claim: text("source_a_claim").notNull(),
  sourceA_url: text("source_a_url"),
  sourceB_claim: text("source_b_claim").notNull(),
  sourceB_url: text("source_b_url"),
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

export const insertCitedSourceSchema = createInsertSchema(citedSources).omit({
  id: true,
});

export const insertRawFactsSchema = createInsertSchema(rawFacts).omit({
  id: true,
});

export const insertPerspectiveSchema = createInsertSchema(perspectives).omit({
  id: true,
});

export interface Article {
  id: number;
  slug: string;
  title: string;
  content: string;
  category: string;
  excerpt: string;
  heroImageUrl: string;
  publishedAt: Date;
  readTime: number;
  sourceCount: number;
  authorName: string;
  authorTitle: string;
}

export interface ExecutiveSummary {
  id: number;
  articleId: number;
  points: string[];
}

export interface TimelineItem {
  id: number;
  articleId: number;
  date: Date;
  title: string;
  description: string;
  type: string; // 'announcement', 'release', etc.
  sourceLabel: string;
  sourceUrl: string;
}

export interface CitedSource {
  id: number;
  articleId: number;
  name: string;
  type: string; // e.g., "Government Document", "News Article", "Official Statement"
  description: string;
  url: string;
  imageUrl: string;
}

export interface RawFacts {
  id: number;
  articleId: number;
  category: string;
  facts: string[];
}

export interface Perspective {
  id: number;
  articleId: number;
  viewpoint: string;
  description: string;
  source: string;
  quote: string;
  color: string; // 'green', 'yellow', 'blue', etc.
  url: string;
  conflictSource: string; // The opposing source
  conflictQuote: string; // The opposing quote
}

export interface ConflictingClaim {
  id: number;
  articleId: number;
  topic: string;
  conflict: string;
  sourceA: {
    claim: string;
    url: string;
  };
  sourceB: {
    claim: string;
    url: string;
  };
}

// Full report structure
export interface ResearchReport {
  article: Article;
  executiveSummary: ExecutiveSummary;
  timelineItems: TimelineItem[];
  citedSources: CitedSource[];
  rawFacts: RawFacts[];
  perspectives: Perspective[];
  conflictingClaims?: ConflictingClaim[];
}

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type InsertExecutiveSummary = z.infer<typeof insertExecutiveSummarySchema>;
export type InsertTimelineItem = z.infer<typeof insertTimelineItemSchema>;
export type InsertCitedSource = z.infer<typeof insertCitedSourceSchema>;
export type InsertRawFacts = z.infer<typeof insertRawFactsSchema>;
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
