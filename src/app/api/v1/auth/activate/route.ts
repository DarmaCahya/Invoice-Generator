import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password, name } = body;

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await AuthService.activateAccount({ token, password, name });
    return NextResponse.json(
      {
        message: 'Akun berhasil diaktifkan.',
        user: result.user,
        token: result.token,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal mengaktifkan akun.' },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 400 });
    }

    return NextResponse.json({ valid: true, token });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error validating token' }, { status: 500 });
  }
}
