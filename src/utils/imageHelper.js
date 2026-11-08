/**
 * Utilitas pemrosesan dan kompresi gambar lokal (HTML5 Canvas).
 * Mengubah file gambar dari galeri / kamera HP menjadi Data URL (base64) yang ringan (~40-80 KB),
 * sehingga cepat dimuat di KTA, tabel, dan tersimpan aman di database Supabase maupun localStorage.
 */
export const processImageUpload = (file, maxWidth = 600, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File yang dipilih bukan gambar valid.'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memproses elemen gambar.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat.'));
    reader.readAsDataURL(file);
  });
};

