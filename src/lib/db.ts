import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import type { User, Portfolio, UserTransactions, Trade, Holding } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PORTFOLIOS_FILE = path.join(DATA_DIR, 'portfolios.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

const STARTING_CASH = 10_000;

// --- Helpers ---

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(filePath: string): T[] {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T[];
}

function writeJSON<T>(filePath: string, data: T[]) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Simple in-memory lock per file to prevent concurrent write races
const locks = new Map<string, Promise<void>>();

async function withLock<T>(filePath: string, fn: () => T | Promise<T>): Promise<T> {
  const existing = locks.get(filePath) ?? Promise.resolve();
  let resolve: () => void;
  const next = new Promise<void>((r) => { resolve = r; });
  locks.set(filePath, next);

  await existing;
  try {
    return await fn();
  } finally {
    resolve!();
  }
}

// =====================
// USERS
// =====================

export async function getAllUsers(): Promise<User[]> {
  return readJSON<User>(USERS_FILE);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getAllUsers();
  return users.find((u) => u.id === id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  return withLock(USERS_FILE, async () => {
    const users = readJSON<User>(USERS_FILE);
    const user: User = {
      id: nanoid(),
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: Date.now(),
    };
    users.push(user);
    writeJSON(USERS_FILE, users);

    // Create empty portfolio for the new user
    await createPortfolio(user.id);
    // Create empty transactions record
    await createTransactions(user.id);

    return user;
  });
}

// =====================
// PORTFOLIOS
// =====================

export async function getPortfolio(userId: string): Promise<Portfolio | undefined> {
  const portfolios = readJSON<Portfolio>(PORTFOLIOS_FILE);
  return portfolios.find((p) => p.userId === userId);
}

async function createPortfolio(userId: string): Promise<Portfolio> {
  return withLock(PORTFOLIOS_FILE, () => {
    const portfolios = readJSON<Portfolio>(PORTFOLIOS_FILE);
    const portfolio: Portfolio = {
      userId,
      cashUSD: STARTING_CASH,
      holdings: {},
    };
    portfolios.push(portfolio);
    writeJSON(PORTFOLIOS_FILE, portfolios);
    return portfolio;
  });
}

export async function updatePortfolio(
  userId: string,
  update: { cashUSD: number; holdings: Record<string, Holding> }
): Promise<Portfolio> {
  return withLock(PORTFOLIOS_FILE, () => {
    const portfolios = readJSON<Portfolio>(PORTFOLIOS_FILE);
    const idx = portfolios.findIndex((p) => p.userId === userId);
    if (idx === -1) throw new Error('Portfolio not found');

    portfolios[idx] = { ...portfolios[idx], ...update };
    writeJSON(PORTFOLIOS_FILE, portfolios);
    return portfolios[idx];
  });
}

// =====================
// TRANSACTIONS
// =====================

export async function getTransactions(userId: string): Promise<Trade[]> {
  const allTx = readJSON<UserTransactions>(TRANSACTIONS_FILE);
  const userTx = allTx.find((t) => t.userId === userId);
  return userTx?.trades ?? [];
}

async function createTransactions(userId: string): Promise<void> {
  return withLock(TRANSACTIONS_FILE, () => {
    const allTx = readJSON<UserTransactions>(TRANSACTIONS_FILE);
    if (!allTx.find((t) => t.userId === userId)) {
      allTx.push({ userId, trades: [] });
      writeJSON(TRANSACTIONS_FILE, allTx);
    }
  });
}

export async function addTrade(userId: string, trade: Trade): Promise<void> {
  return withLock(TRANSACTIONS_FILE, () => {
    const allTx = readJSON<UserTransactions>(TRANSACTIONS_FILE);
    const idx = allTx.findIndex((t) => t.userId === userId);
    if (idx === -1) {
      allTx.push({ userId, trades: [trade] });
    } else {
      allTx[idx].trades.unshift(trade);
    }
    writeJSON(TRANSACTIONS_FILE, allTx);
  });
}
