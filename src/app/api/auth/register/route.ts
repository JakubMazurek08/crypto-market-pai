import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import {
  hashPassword,
  createToken,
  setAuthCookie,
  validateEmail,
  validatePassword,
} from '@/lib/auth';
import type { RegisterRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequest;
    const { email, password } = body;

    // Validate input
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ success: false, error: emailError }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
    }

    // Check if user already exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash);

    // Create token and set cookie
    const token = createToken(user.id);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
