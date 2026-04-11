import 'server-only'

type SignatureSheetRow = {
  kelas: string
  nama: string
  nim: string | null
  prodi: string
}

type AttendanceHistoryRow = {
  kelas: string
  nama_mahasiswa: string
  pertemuan: number
  status: string
  tanggal: string
}

type CertificatePdfData = {
  attendancePercentage: number
  kelas: string
  mahasiswaId: string
  nama: string
  nim: string | null
  prodi: string
  totalHadir: number
  totalPertemuan: number
  issuedAt?: string | null
}

type BuildPdfResult = {
  buffer: ArrayBuffer
  fileName: string
}

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

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function loadPdfModules() {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  return { autoTable, jsPDF }
}

export async function buildSignatureSheetPdf(
  rows: SignatureSheetRow[],
  filters: string[],
  generatedAt: Date = new Date(),
): Promise<BuildPdfResult> {
  const { autoTable, jsPDF } = await loadPdfModules()
  const pdf = new jsPDF({
    compress: true,
    format: 'a4',
    orientation: 'portrait',
    unit: 'mm',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text('Lembar Tanda Tangan Mahasiswa LCC', pageWidth / 2, 16, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text('Politeknik LP3I Pekanbaru', pageWidth / 2, 22, { align: 'center' })
  pdf.text(`Tanggal generate: ${formatLongDate(generatedAt)}`, pageWidth / 2, 28, { align: 'center' })

  if (filters.length > 0) {
    pdf.setFontSize(9)
    pdf.text(filters.join(' | '), pageWidth / 2, 34, { align: 'center' })
  }

  autoTable(pdf, {
    body: rows.length > 0
      ? rows.map((row, index) => [
        index + 1,
        row.nim ?? '-',
        row.nama,
        row.prodi,
        row.kelas,
        '',
      ])
      : [['-', '-', 'Tidak ada data mahasiswa', '-', '-', '-']],
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 55 },
      3: { cellWidth: 34 },
      4: { cellWidth: 26 },
      5: { cellWidth: 34 },
    },
    head: [['No', 'NIM', 'Nama', 'Prodi', 'Kelas LCC', 'Tanda Tangan']],
    margin: { bottom: 26, left: 12, right: 12, top: 40 },
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
      pdf.line(12, pageHeight - 18, currentPageWidth - 12, pageHeight - 18)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.text('Penanggung jawab kegiatan: ____________________', 12, pageHeight - 11)
      pdf.text(`Halaman ${pdf.getNumberOfPages()}`, currentPageWidth - 12, pageHeight - 11, {
        align: 'right',
      })
    },
  })

  return {
    buffer: pdf.output('arraybuffer'),
    fileName: `lembar-tanda-tangan-lcc-${formatShortDate(generatedAt)}.pdf`,
  }
}

export async function buildAttendanceHistoryPdf(
  rows: AttendanceHistoryRow[],
  filters: string[],
  generatedAt: Date = new Date(),
): Promise<BuildPdfResult> {
  const { autoTable, jsPDF } = await loadPdfModules()
  const pdf = new jsPDF({
    compress: true,
    format: 'a4',
    orientation: 'landscape',
    unit: 'mm',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const hadirCount = rows.filter((row) => row.status === 'Hadir').length
  const izinCount = rows.filter((row) => row.status === 'Izin').length
  const alfaCount = rows.filter((row) => row.status === 'Alfa').length

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text('Riwayat Absensi Mahasiswa LCC', pageWidth / 2, 16, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`Tanggal generate: ${formatLongDate(generatedAt)}`, pageWidth / 2, 22, { align: 'center' })

  const summaryText = [
    `Total data: ${rows.length}`,
    `Hadir: ${hadirCount}`,
    `Izin: ${izinCount}`,
    `Alfa: ${alfaCount}`,
  ].join(' | ')

  pdf.setFontSize(9)
  pdf.text(summaryText, pageWidth / 2, 28, { align: 'center' })

  if (filters.length > 0) {
    pdf.text(filters.join(' | '), pageWidth / 2, 34, { align: 'center' })
  }

  autoTable(pdf, {
    body: rows.length > 0
      ? rows.map((row, index) => [
        index + 1,
        row.tanggal,
        row.pertemuan,
        row.nama_mahasiswa,
        row.kelas,
        row.status,
      ])
      : [['-', '-', '-', 'Tidak ada riwayat absensi', '-', '-']],
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 90 },
      4: { cellWidth: 45 },
      5: { cellWidth: 28, halign: 'center' },
    },
    head: [['No', 'Tanggal', 'Pertemuan', 'Nama Mahasiswa', 'Kelas', 'Status']],
    margin: { bottom: 18, left: 12, right: 12, top: 40 },
    styles: {
      cellPadding: 3,
      font: 'helvetica',
      fontSize: 9,
      lineColor: [160, 160, 160],
      lineWidth: 0.2,
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
      pdf.line(12, pageHeight - 12, currentPageWidth - 12, pageHeight - 12)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text(`Halaman ${pdf.getNumberOfPages()}`, currentPageWidth - 12, pageHeight - 6, {
        align: 'right',
      })
    },
  })

  return {
    buffer: pdf.output('arraybuffer'),
    fileName: `riwayat-absensi-lcc-${formatShortDate(generatedAt)}.pdf`,
  }
}

export async function buildCertificatePdf(
  data: CertificatePdfData,
  generatedAt: Date = new Date(),
): Promise<BuildPdfResult> {
  const { jsPDF } = await loadPdfModules()
  const pdf = new jsPDF({
    compress: true,
    format: 'a4',
    orientation: 'landscape',
    unit: 'mm',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const issuedAt = data.issuedAt ? new Date(data.issuedAt) : generatedAt

  pdf.setDrawColor(30, 64, 175)
  pdf.setLineWidth(1.2)
  pdf.rect(12, 12, pageWidth - 24, pageHeight - 24)

  pdf.setDrawColor(191, 219, 254)
  pdf.setLineWidth(0.5)
  pdf.rect(17, 17, pageWidth - 34, pageHeight - 34)

  pdf.setTextColor(30, 64, 175)
  pdf.setFont('times', 'bold')
  pdf.setFontSize(24)
  pdf.text('SERTIFIKAT KEHADIRAN', pageWidth / 2, 34, { align: 'center' })

  pdf.setTextColor(51, 65, 85)
  pdf.setFont('times', 'normal')
  pdf.setFontSize(13)
  pdf.text('Learning Coffee Community - Politeknik LP3I Pekanbaru', pageWidth / 2, 43, { align: 'center' })

  pdf.setFontSize(12)
  pdf.text('Diberikan kepada', pageWidth / 2, 58, { align: 'center' })

  pdf.setFont('times', 'bold')
  pdf.setFontSize(26)
  pdf.setTextColor(15, 23, 42)
  pdf.text(data.nama, pageWidth / 2, 73, { align: 'center' })

  pdf.setFont('times', 'normal')
  pdf.setFontSize(12)
  pdf.text(`NIM: ${data.nim ?? '-'}`, pageWidth / 2, 82, { align: 'center' })
  pdf.text(`Program Studi: ${data.prodi} | Kelas LCC: ${data.kelas}`, pageWidth / 2, 90, { align: 'center' })

  pdf.text(
    'atas partisipasi dan kehadiran aktif dalam kegiatan Learning Coffee Community.',
    pageWidth / 2,
    102,
    { align: 'center' },
  )

  pdf.setFont('times', 'bold')
  pdf.setFontSize(14)
  pdf.text(
    `Kehadiran ${data.totalHadir} dari ${data.totalPertemuan} pertemuan (${data.attendancePercentage}%)`,
    pageWidth / 2,
    115,
    { align: 'center' },
  )

  pdf.setFont('times', 'normal')
  pdf.setFontSize(11)
  pdf.text(`Diterbitkan pada ${formatLongDate(issuedAt)}`, pageWidth / 2, 128, { align: 'center' })

  pdf.line(pageWidth - 92, 150, pageWidth - 32, 150)
  pdf.setFontSize(11)
  pdf.text('Koordinator LCC', pageWidth - 62, 156, { align: 'center' })

  return {
    buffer: pdf.output('arraybuffer'),
    fileName: `sertifikat-kehadiran-${sanitizeFileName(data.nama || data.mahasiswaId)}-${formatShortDate(generatedAt)}.pdf`,
  }
}

export function buildPdfResponse(buffer: ArrayBuffer, fileName: string, shouldDownload: boolean) {
  return new Response(buffer, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `${shouldDownload ? 'attachment' : 'inline'}; filename="${fileName}"`,
      'Content-Type': 'application/pdf',
    },
  })
}
