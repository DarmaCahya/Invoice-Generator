import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, workspaceName } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await AuthService.register({ name, email, password, workspaceName });
    return NextResponse.json(
      {
        message: 'Registrasi berhasil.',
        user: result.user,
        token: result.token,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Terjadi kesalahan saat registrasi.' },
      { status: 400 }
    );
  }
}
