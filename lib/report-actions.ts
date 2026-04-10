'use server'

import { createClient } from '@/lib/supabase/server'
import type { Absensi } from './types'

// Generate Excel export data for attendance
export async function generateAttendanceExcel() {
  const supabase = await createClient()
  const { data: absensi } = await supabase
    .from('absensi')
    .select('*')
    .order('tanggal', { ascending: false })
  
  if (!absensi) return null
  
  // Prepare CSV format
  const headers = ['Tanggal', 'Pertemuan', 'Nama Mahasiswa', 'Kelas', 'Status']
  const rows = absensi.map((a: Absensi) => [
    a.tanggal,
    a.pertemuan,
    a.nama_mahasiswa,
    a.kelas,
    a.status,
  ])
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  return csv
}

// Generate Excel export for statistics by class
export async function generateClassStatisticsExcel() {
  const supabase = await createClient()
  const { data: mahasiswa } = await supabase.from('mahasiswa').select('id, nama, kelas, prodi')
  const { data: absensi } = await supabase.from('absensi').select('mahasiswa_id, status')
  
  if (!mahasiswa || !absensi) return null
  
  const studentStats = new Map<string, { nama: string; kelas: string; prodi: string; hadir: number; izin: number; alfa: number; total: number }>()
  
  mahasiswa.forEach((m: any) => {
    studentStats.set(m.id, { nama: m.nama, kelas: m.kelas, prodi: m.prodi, hadir: 0, izin: 0, alfa: 0, total: 0 })
  })
  
  absensi.forEach((a: any) => {
    const stats = studentStats.get(a.mahasiswa_id)
    if (stats) {
      stats.total++
      if (a.status === 'Hadir') stats.hadir++
      else if (a.status === 'Izin') stats.izin++
      else if (a.status === 'Alfa') stats.alfa++
    }
  })
  
  const headers = ['Nama', 'Kelas', 'Prodi', 'Hadir', 'Izin', 'Alfa', 'Total', 'Persentase']
  const rows = Array.from(studentStats.values()).map(stats => [
    stats.nama,
    stats.kelas,
    stats.prodi,
    stats.hadir,
    stats.izin,
    stats.alfa,
    stats.total,
    stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0,
  ])
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  return csv
}

// Generate printable attendance report
export async function generatePrintableReport(tanggal_mulai?: string, tanggal_akhir?: string) {
  const supabase = await createClient()
  
  let query = supabase.from('absensi').select('*')
  
  if (tanggal_mulai) {
    query = query.gte('tanggal', tanggal_mulai)
  }
  if (tanggal_akhir) {
    query = query.lte('tanggal', tanggal_akhir)
  }
  
  const { data: absensi } = await query.order('tanggal')
  
  if (!absensi) return null
  
  // Group by meeting
  const grouped = new Map<number, Absensi[]>()
  absensi.forEach(a => {
    if (!grouped.has(a.pertemuan)) {
      grouped.set(a.pertemuan, [])
    }
    grouped.get(a.pertemuan)!.push(a)
  })
  
  return Array.from(grouped.entries()).map(([pertemuan, records]) => ({
    pertemuan,
    tanggal: records[0]?.tanggal,
    total: records.length,
    hadir: records.filter(r => r.status === 'Hadir').length,
    izin: records.filter(r => r.status === 'Izin').length,
    alfa: records.filter(r => r.status === 'Alfa').length,
    data: records,
  }))
}

// Get summary stats for PDF report
export async function getSummaryStatistics() {
  const supabase = await createClient()
  
  const { data: mahasiswa } = await supabase.from('mahasiswa').select('id')
  const { data: absensi } = await supabase.from('absensi').select('status')
  const { data: pertemuan } = await supabase.from('pertemuan').select('id')
  
  const totalHadir = absensi?.filter(a => a.status === 'Hadir').length || 0
  const totalIzin = absensi?.filter(a => a.status === 'Izin').length || 0
  const totalAlfa = absensi?.filter(a => a.status === 'Alfa').length || 0
  const totalAbsensi = absensi?.length || 0
  
  return {
    totalMahasiswa: mahasiswa?.length || 0,
    totalPertemuan: pertemuan?.length || 0,
    totalAbsensi,
    totalHadir,
    totalIzin,
    totalAlfa,
    persentaseKehadiran: totalAbsensi > 0 ? Math.round((totalHadir / totalAbsensi) * 100) : 0,
  }
}
