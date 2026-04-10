export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateNama(nama: string): void {
  if (!nama || nama.trim().length === 0) throw new ValidationError('Nama tidak boleh kosong')
  if (nama.trim().length < 3) throw new ValidationError('Nama minimal 3 karakter')
  if (nama.length > 100) throw new ValidationError('Nama maksimal 100 karakter')
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) throw new ValidationError('Email tidak valid')
}

export function validatePassword(password: string): void {
  if (password.length < 8) throw new ValidationError('Password minimal 8 karakter')
  if (!/[A-Z]/.test(password)) throw new ValidationError('Password harus mengandung huruf besar')
  if (!/[0-9]/.test(password)) throw new ValidationError('Password harus mengandung angka')
}

export function validateTanggal(tanggal: string): void {
  const today = new Date().toISOString().split('T')[0]
  if (tanggal > today) throw new ValidationError('Tanggal tidak boleh melebihi hari ini')
  if (tanggal < '2024-01-01') throw new ValidationError('Tanggal terlalu jauh ke belakang')
}

export function validatePertemuan(pertemuan: number): void {
  if (!Number.isInteger(pertemuan) || pertemuan < 1 || pertemuan > 16) {
    throw new ValidationError('Pertemuan harus antara 1-16')
  }
}
