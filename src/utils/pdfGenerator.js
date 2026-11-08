// ==============================================================================
// PDF GENERATOR SERVICE UNTUK SURAT RESMI SATPOL PP KAB. HULU SUNGAI TENGAH
// ==============================================================================
import { jsPDF } from 'jspdf';

export const generateOfficialLetterPDF = (pelanggaran, currentStep) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 18;

  // 1. KOP SURAT RESMI PEMERINTAH DAERAH
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 42, 74); // Navy
  doc.text('PEMERINTAH KABUPATEN HULU SUNGAI TENGAH', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.setFontSize(15);
  doc.text('SATUAN POLISI PAMONG PRAJA', pageWidth / 2, yPos, { align: 'center' });

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Jalan Perwira No. 1, Barabai, Kalimantan Selatan — Kode Pos 71311', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 4;
  doc.text('Telepon / Call Center: (0517) 41234 | Pos-el: satpolpp@hulusungaitengahkab.go.id', pageWidth / 2, yPos, { align: 'center' });

  // Double Line Separator
  yPos += 4;
  doc.setDrawColor(15, 42, 74);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos + 1.2, pageWidth - margin, yPos + 1.2);

  // 2. JUDUL SURAT BERDASARKAN TAHAP
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 42, 74);

  let title = 'SURAT PERINGATAN PERTAMA (SP-1)';
  if (currentStep.tahap === 'pernyataan') title = 'SURAT PERNYATAAN & KESEPAKATAN TERTIB PERDA';
  if (currentStep.tahap === 'sp2') title = 'SURAT PERINGATAN KEDUA (SP-2)';
  if (currentStep.tahap === 'sp3') title = 'SURAT PERINGATAN KETIGA (SP-3)';
  if (currentStep.tahap === 'eksekusi') title = 'SURAT PERINTAH PENINDAKAN & EKSEKUSI PENERTIBAN';
  if (currentStep.tahap === 'selesai') title = 'BERITA ACARA PENYELESAIAN PELANGGARAN PERDA';

  doc.text(title, pageWidth / 2, yPos, { align: 'center' });

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Nomor: ${currentStep.nomorSurat || '300/SP/SatpolPP-HST/2026'}`, pageWidth / 2, yPos, { align: 'center' });

  // 3. PEMBUKA SURAT
  yPos += 12;
  doc.setFontSize(10);
  doc.text('Berdasarkan hasil pengawasan dan patroli penegakan Peraturan Daerah Kabupaten Hulu', margin, yPos);
  yPos += 5;
  doc.text('Sungai Tengah, dengan ini disampaikan kepada:', margin, yPos);

  // 4. BIODATA PELANGGAR (TABULAR)
  yPos += 8;
  const colLabel = margin + 5;
  const colColon = margin + 45;
  const colVal = margin + 48;

  const row = (label, val) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, colLabel, yPos);
    doc.text(':', colColon, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val || '-'), colVal, yPos);
    yPos += 5.5;
  };

  row('Nama Lengkap', pelanggaran.namaPelanggar);
  row('Nomor Induk Kependudukan', pelanggaran.nik);
  row('Alamat Tinggal', pelanggaran.alamat);
  row('Kecamatan / Desa', `${pelanggaran.kecamatan} / ${pelanggaran.desa || '-'}`);
  row('No. Register Perkara', pelanggaran.nomorRegister);

  // 5. ISI PERKARA & PASAL
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('Bahwa yang bersangkutan telah terbukti melakukan perbuatan yang melanggar ketentuan:', margin, yPos);
  
  yPos += 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos - 3, pageWidth - (margin * 2), 24, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, yPos - 3, pageWidth - (margin * 2), 24, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9); // Amber
  doc.text('Ketentuan Peraturan Daerah:', margin + 4, yPos + 2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('• Perda Kab. Hulu Sungai Tengah No. 04 Tahun 2021 tentang Penyelenggaraan Trantibum', margin + 4, yPos + 7);
  doc.text(`• Lokasi Kejadian: ${pelanggaran.lokasiNama || pelanggaran.alamat}`, margin + 4, yPos + 12);
  doc.text(`• Catatan: ${currentStep.catatan || pelanggaran.deskripsi.slice(0, 85)}...`, margin + 4, yPos + 17);

  // 6. INSTRUKSI & KONSEKUENSI HUKUM
  yPos += 28;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  
  let instruksi = 'Diberikan waktu 3 (tiga) hari kalender terhitung sejak diterimanya surat ini untuk menaati ketentuan tersebut.';
  if (currentStep.tahap === 'sp3') {
    instruksi = 'Ini merupakan Peringatan Terakhir (SP-3). Apabila dalam waktu 1 x 24 jam belum ada penertiban mandiri, maka Tim Eksekusi Gabungan Satpol PP akan melakukan tindakan penertiban paksa dan penyitaan barang.';
  } else if (currentStep.tahap === 'eksekusi') {
    instruksi = 'Berdasarkan wewenang Penegakan Perda dan Surat Perintah Kasatpol PP HST, diperintahkan kepada Tim Eksekusi untuk melaksanakan tindakan pembongkaran/penertiban fisik di lokasi kejadian.';
  }

  const splitInstruksi = doc.splitTextToSize(instruksi, pageWidth - (margin * 2));
  doc.text(splitInstruksi, margin, yPos);

  // 7. TANDA TANGAN & QR CODE VERIFIKASI KEABSAHAN
  yPos += 26;
  const signX = pageWidth - margin - 65;

  // Verification Box / QR Simulation
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, yPos, 48, 38, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('VERIFIKASI DIGITAL LINDUNGMAS HST', margin + 4, yPos + 7);
  
  // Fake QR graphic inside
  doc.setFillColor(15, 42, 74);
  doc.rect(margin + 5, yPos + 11, 22, 22, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 7, yPos + 13, 7, 7, 'F');
  doc.rect(margin + 18, yPos + 13, 7, 7, 'F');
  doc.rect(margin + 7, yPos + 24, 7, 7, 'F');
  doc.setFillColor(15, 42, 74);
  doc.rect(margin + 9, yPos + 15, 3, 3, 'F');
  doc.rect(margin + 20, yPos + 15, 3, 3, 'F');
  doc.rect(margin + 9, yPos + 26, 3, 3, 'F');

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Pindai untuk cek', margin + 29, yPos + 17);
  doc.text('keaslian dokumen', margin + 29, yPos + 21);
  doc.text('resmi Pemkab HST', margin + 29, yPos + 25);

  // Official Signature Box
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Barabai, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), signX, yPos + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('KEPALA SATUAN POLISI PAMONG PRAJA', signX, yPos + 10);
  doc.text('KABUPATEN HULU SUNGAI TENGAH', signX, yPos + 15);

  // Stamp simulation
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.4);
  doc.roundedRect(signX - 4, yPos + 16, 42, 14, 2, 2, 'D');
  doc.setFontSize(8);
  doc.setTextColor(220, 38, 38);
  doc.text('TERVERIFIKASI RESMI', signX + 2, yPos + 23);
  doc.text('PENEGAKAN PERDA HST', signX + 2, yPos + 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Drs. H. SUBHAN, M.Si', signX, yPos + 37);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Pembina Utama Muda (IV/c)', signX, yPos + 41);
  doc.text('NIP. 19740815 199603 1 002', signX, yPos + 45);

  // 8. FOOTER NOTE
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen ini diterbitkan secara otomatis oleh Sistem LINDUNGMAS HST | Register: ${pelanggaran.nomorRegister}`, margin, 285);

  return doc;
};

