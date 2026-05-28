import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import {
  verifyPassword,
  createToken,
  setAuthCookie,
  validateEmail,
} from '@/lib/auth';
import type { LoginRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequest;
    const { email, password } = body;

    // Basic validation
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ success: false, error: emailError }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create token and set cookie
    const token = createToken(user.id);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
