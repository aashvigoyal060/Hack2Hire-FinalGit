import {
  interviews,
  messages,
  type Interview,
  type InsertInterview,
  type Message,
  type InsertMessage,
} from "../shared/schema.js";
import { db, pool } from "./db.js";
import { eq, asc, desc } from "drizzle-orm";

export interface IStorage {
  createInterview(interview: InsertInterview): Promise<Interview>;
  listInterviews(): Promise<Interview[]>;
  getInterview(id: number): Promise<Interview | undefined>;
  updateInterview(id: number, partial: Partial<Interview>): Promise<Interview>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(interviewId: number): Promise<Message[]>;
  updateMessage(id: number, partial: Partial<Message>): Promise<Message>;
}

async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    console.error(
      "Database connection failed:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

export class MemoryStorage implements IStorage {
  private interviews = new Map<number, Interview>();
  private messages = new Map<number, Message>();
  private nextInterviewId = 1;
  private nextMessageId = 1;

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const newInterview: Interview = {
      id: this.nextInterviewId++,
      candidateName: interview.candidateName,
      resumeText: interview.resumeText,
      jobDescription: interview.jobDescription,
      interviewType: interview.interviewType ?? "mixed",
      status: "pending",
      currentQuestionIndex: 0,
      scores: null,
      feedback: null,
      createdAt: new Date(),
    };
    this.interviews.set(newInterview.id, newInterview);
    return newInterview;
  }

  async getInterview(id: number): Promise<Interview | undefined> {
    return this.interviews.get(id);
  }

  async listInterviews(): Promise<Interview[]> {
    return [...this.interviews.values()].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async updateInterview(
    id: number,
    partial: Partial<Interview>,
  ): Promise<Interview> {
    const existing = this.interviews.get(id);
    if (!existing) {
      throw new Error(`Interview ${id} not found`);
    }
    const updated = { ...existing, ...partial };
    this.interviews.set(id, updated);
    return updated;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: this.nextMessageId++,
      interviewId: message.interviewId,
      role: message.role,
      content: message.content,
      type: message.type ?? "answer",
      timeTaken: message.timeTaken ?? null,
      analysis: message.analysis ?? null,
      createdAt: new Date(),
    };
    this.messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async getMessages(interviewId: number): Promise<Message[]> {
    return [...this.messages.values()]
      .filter((m) => m.interviewId === interviewId)
      .sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
  }

  async updateMessage(
    id: number,
    partial: Partial<Message>,
  ): Promise<Message> {
    const existing = this.messages.get(id);
    if (!existing) {
      throw new Error(`Message ${id} not found`);
    }
    const updated = { ...existing, ...partial };
    this.messages.set(id, updated);
    return updated;
  }
}

export class DatabaseStorage implements IStorage {
  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db
      .insert(interviews)
      .values(interview)
      .returning();
    return newInterview;
  }

  async getInterview(id: number): Promise<Interview | undefined> {
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, id));
    return interview;
  }

  async listInterviews(): Promise<Interview[]> {
    return db
      .select()
      .from(interviews)
      .orderBy(desc(interviews.createdAt));
  }

  async updateInterview(
    id: number,
    partial: Partial<Interview>,
  ): Promise<Interview> {
    const [updated] = await db
      .update(interviews)
      .set(partial)
      .where(eq(interviews.id, id))
      .returning();
    return updated;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getMessages(interviewId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.interviewId, interviewId))
      .orderBy(asc(messages.createdAt));
  }

  async updateMessage(
    id: number,
    partial: Partial<Message>,
  ): Promise<Message> {
    const [updated] = await db
      .update(messages)
      .set(partial)
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }
}

export let storage: IStorage;

export async function initStorage(): Promise<void> {
  if (process.env.USE_MEMORY_STORAGE === "true") {
    console.warn("Using in-memory storage (USE_MEMORY_STORAGE=true)");
    storage = new MemoryStorage();
    return;
  }

  if (await isDatabaseAvailable()) {
    storage = new DatabaseStorage();
    return;
  }

  console.error(
    "DATABASE_URL missing or invalid — using in-memory storage. " +
      "Set DATABASE_URL in Railway Variables for persistent data.",
  );
  storage = new MemoryStorage();
}
