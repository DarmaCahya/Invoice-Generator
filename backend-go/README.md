# Golang Backend Migration & Learning Guide 🚀

Proyek ini dirancang agar Anda bisa membandingkan secara langsung (*side-by-side*) bagaimana logika backend di **Next.js App Router (TypeScript)** diterjemahkan ke **Golang (Go)**.

## Perbandingan Struktur Kode

| Komponen | Next.js (TypeScript) | Golang (Go) |
| :--- | :--- | :--- |
| **Model Data / Schema** | `prisma/schema.prisma` | `backend-go/internal/models/models.go` |
| **Service Logic** | `src/services/invoice.service.ts` | `backend-go/cmd/main.go` (`handleInvoices`) |
| **API Endpoints** | `src/app/api/v1/invoices/route.ts` | `backend-go/cmd/main.go` (`http.HandleFunc`) |
| **HTTP Server Engine** | Next.js Server / Node.js | Golang `net/http` (ringan & sangat cepat) |

## Cara Menjalankan Backend Golang:

1. Buka terminal di folder `backend-go`:
   ```bash
   cd backend-go
   go run cmd/main.go
   ```
2. Server Golang akan berjalan di `http://localhost:8080`.
3. Untuk mengalihkan traffic Frontend Next.js ke Golang Server:
   Buka `.env.local` pada project Next.js dan ubah:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
   ```
4. Refresh browser! Frontend Next.js sekarang secara instan menggunakan backend Golang tanpa perlu mengubah kode komponen UI sama sekali.
