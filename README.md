# 🚨 Discord BMKG Gempa Monitor Bot

Bot Discord otomatis yang berfungsi untuk memantau aktivitas gempa bumi terkini di Indonesia secara real-time menggunakan data resmi dari [BMKG](https://data.bmkg.go.id/gempabumi/) (Badan Meteorologi, Klimatologi, dan Geofisika). 

Bot ini dirancang menggunakan **Discord.js v14** dengan implementasi struktur UI modern berbasis **Components V2** (*ContainerBuilder*, *TextDisplayBuilder*, *SeparatorBuilder*).

---

## ✨ Fitur Utama

* **Auto-Check Real-Time:** Memantau endpoint API BMKG setiap saat untuk mendeteksi data gempa terbaru tanpa membebani rate limit.
* **Anti-Duplikasi Log:** Dilengkapi memori internal (`lastGempaTime`) agar bot hanya mengirimkan log ketika benar-benar terjadi aktivitas gempa baru.
* **Layout Modern (Components V2):** Tampilan log informasi yang bersih, menggunakan separator visual, dan penataan teks yang rapi.
* **Slash Command (`/reload`):** Memaksa bot untuk mengambil data gempa bumi terbaru secara instan dan mengirimkannya ke channel.
* **Tombol Interaktif (Interactive Buttons):**
  * `Clear Memory`: Menghapus cache waktu gempa terakhir agar pengecekan berikutnya dipaksa mendeteksi data baru.
  * `Regenerate`: Melakukan pengecekan ulang API secara manual lewat interaksi tombol.
  * `Website`: Pintasan langsung menuju situs resmi BMKG.

---

## 🛠️ Persyaratan Sistem

Sebelum menjalankan bot, pastikan Anda sudah menginstal:
* [Node.js](https://nodejs.org/) (Versi 16.11.0 atau lebih tinggi)
* npm (Bawaan dari Node.js)
* Akun Discord & [Discord Developer Portal](https://discord.com/developers/applications) untuk membuat bot.

---

## 🚀 Langkah-Langkah Instalasi & Menjalankan Bot

Jalankan perintah-perintah berikut secara berurutan di terminal/VPS Anda untuk menginstal dan menjalankan bot:

```bash
# 1. Clone repositori ini ke lokal atau VPS Anda
git clone https://github.com/mzpenk/discord-gempa-bot.git

# 2. Masuk ke dalam direktori proyek
cd nama-repo

# 3. Instal semua dependencies/package yang dibutuhkan
npm install

# 4. Buat file .env baru dan isi konfigurasi token Anda
nano .env
