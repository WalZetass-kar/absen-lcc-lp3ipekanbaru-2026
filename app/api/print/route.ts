import { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const kelas = request.nextUrl.searchParams.get('kelas')
  const prodi = request.nextUrl.searchParams.get('prodi')
  const shouldDownload = request.nextUrl.searchParams.get('download') === '1'

  let query = supabase
    .from('members')
    .select('nim, nama, prodi, kelas')
    .order('nama', { ascending: true })

  if (kelas) {
    query = query.eq('kelas', kelas)
  }

  if (prodi) {
    query = query.eq('prodi', prodi)
  }

  const { data: members, error: membersError } = await query

  if (membersError) {
    return Response.json({ error: membersError.message || 'Gagal mengambil data anggota' }, { status: 500 })
  }

  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const now = new Date()
  const pdf = new jsPDF({
    compress: true,
    format: 'a4',
    orientation: 'portrait',
    unit: 'mm',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const title = 'Daftar Absensi Kegiatan MCC'
  const filters = [
    kelas ? `Kelas LCC: ${kelas}` : null,
    prodi ? `Prodi: ${prodi}` : null,
  ].filter(Boolean)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(title, pageWidth / 2, 16, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text('Politeknik LP3I Pekanbaru', pageWidth / 2, 22, { align: 'center' })
  pdf.text('Tahun 2026', pageWidth / 2, 27, { align: 'center' })
  pdf.text(`Tanggal generate: ${formatLongDate(now)}`, pageWidth / 2, 32, { align: 'center' })

  if (filters.length > 0) {
    pdf.setFontSize(9)
    pdf.text(filters.join(' | '), pageWidth / 2, 37, { align: 'center' })
  }

  autoTable(pdf, {
    body: (members ?? []).map((member, index) => [
      index + 1,
      member.nim ?? '-',
      member.nama,
      member.prodi,
      '',
    ]),
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 34 },
      2: { cellWidth: 62 },
      3: { cellWidth: 46 },
      4: { cellWidth: 36 },
    },
    head: [['No', 'NIM', 'Nama', 'Prodi', 'Tanda Tangan']],
    margin: { bottom: 26, left: 14, right: 14, top: 42 },
    styles: {
      cellPadding: 3,
      font: 'helvetica',
      fontSize: 9,
      lineColor: [160, 160, 160],
      lineWidth: 0.2,
      minCellHeight: 11,
      overflow: 'linebreak',
      textColor: [33, 37, 41],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: () => {
      const currentPageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      pdf.setDrawColor(203, 213, 225)
      pdf.line(14, pageHeight - 18, currentPageWidth - 14, pageHeight - 18)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.text('Penanggung jawab kegiatan: ____________________', 14, pageHeight - 11)
      pdf.text(`Halaman ${pdf.getNumberOfPages()}`, currentPageWidth - 14, pageHeight - 11, {
        align: 'right',
      })
    },
  })

  const fileName = `daftar-absensi-kegiatan-mcc-${formatShortDate(now)}.pdf`

  return new Response(pdf.output('arraybuffer'), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `${shouldDownload ? 'attachment' : 'inline'}; filename="${fileName}"`,
      'Content-Type': 'application/pdf',
    },
  })
}
