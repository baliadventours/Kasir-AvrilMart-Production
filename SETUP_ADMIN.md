# Setup Admin Pertama

Untuk membuat akun administrator pertama, gunakan Supabase API secara langsung:

## Cara Membuat Admin/Kasir Pertama

1. Buka browser console (F12 di Chrome)
2. Copy dan paste kode berikut, ganti dengan data yang sesuai:

```javascript
// Untuk membuat ADMIN pertama
fetch('https://ybvbnfoahysmkigqamqp.supabase.co/functions/v1/make-server-b5055851/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidmJuZm9haHlzbWtpZ3FhbXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjM2NDIsImV4cCI6MjA4NzczOTY0Mn0.31jWUsRuHNUkK0EHCFyPDLmzRb5-xbFDRLeJhpcHUlw'
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Administrator',
    role: 'admin'
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

3. Setelah berhasil, login dengan:
   - Email: admin@example.com
   - Password: admin123

## Membuat Kasir

Setelah login sebagai admin, Anda dapat membuat akun kasir melalui menu "User Management" di aplikasi.

## Role & Permission

### Administrator
- Akses penuh ke semua fitur
- Kelola inventory dan produk
- Lihat sales history dan laporan
- Kelola user (tambah kasir)
- Akses Point of Sale

### Kasir
- Hanya akses Point of Sale
- Tidak bisa edit inventory
- Tidak bisa lihat sales history
- Tidak bisa kelola user
