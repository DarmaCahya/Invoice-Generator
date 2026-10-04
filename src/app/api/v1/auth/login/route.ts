import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await AuthService.login({ email, password });
    return NextResponse.json(
      {
        message: 'Login berhasil.',
        user: result.user,
        token: result.token,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const status = error.code === 'ACCOUNT_INACTIVE' ? 403 : 401;
    return NextResponse.json(
      {
        message: error.message || 'Gagal melakukan login.',
        code: error.code || 'UNAUTHORIZED',
      },
      { status }
    );
  }
}
