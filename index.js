require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder,   
    ButtonStyle,
    REST,             
    Routes,
    // --- IMPORT MODULE COMPONENTS V2 ---
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Endpoint JSON resmi dari BMKG untuk gempa bumi terbaru/terkini
const BMKG_API_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json';
const BMKG_MAP_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/';

// TARGET CHANNEL ID (Ganti dengan ID Channel Discord tempat log akan dikirim)
const TARGET_CHANNEL_ID = process.env.CHANNEL_ID || 'YOUR_CHANNEL_ID_DISCORD';

// Interval pengecekan (dalam milidetik). 60000 ms = 1 Menit
const CHECK_INTERVAL = 2000; 

// Menyimpan penanda gempa terakhir agar tidak terjadi duplikasi kiriman
let lastGempaTime = null;

// Objek global sementara untuk menyimpan data payload terakhir agar bisa dikirim ulang oleh /reload
let lastGempaPayload = null;

/**
 * Fungsi pembantu untuk memformat input emoji pada ButtonBuilder.
 * Menerima format: Nama Mentah ("🔄"), Format Kustom ("<:name:id>"), atau ID saja ("123456789")
 */
function parseButtonEmoji(emojiInput) {
    if (!emojiInput) return null;
    
    // Jika input hanya berupa deretan angka (hanya ID), ubah menjadi object ID untuk API Discord
    if (/^\d+$/.test(emojiInput.trim())) {
        return { id: emojiInput.trim() };
    }
    
    // Jika input berupa format lengkap emoji kustom (<:nama:id> atau <a:nama:id>)
    const customEmojiMatch = emojiInput.match(/<?(?:a)?:?\w+:(\d+)>?/);
    if (customEmojiMatch) {
        return { id: customEmojiMatch[1] };
    }
    
    // Kembalikan string bawaan jika berupa emoji unicode biasa (e.g. "👤")
    return emojiInput.trim();
}

client.once('ready', async () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    
    // --- REGISTRASI SLASH COMMAND /RELOAD ---
    const commands = [
        {
            name: 'reload',
            description: 'Mengirim ulang data log gempa bumi terbaru dari BMKG ke channel ini.',
        },
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('⏳ Memulai registrasi slash commands (/) global...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ Slash commands (/) berhasil didaftarkan secara global!');
    } catch (error) {
        console.error('❌ Gagal mendaftarkan slash command:', error);
    }
    // ----------------------------------------

    console.log(`📡 Sistem Auto-Check BMKG aktif. Mengecek setiap ${CHECK_INTERVAL / 1000} detik...`);
    
    // Jalankan pengecekan pertama kali saat bot baru dinyalakan
    await checkBmkgEarthquake();

    // Set interval untuk berjalan otomatis secara berkala
    setInterval(async () => {
        await checkBmkgEarthquake();
    }, CHECK_INTERVAL);
});

// Fungsi Utama Pengecekan Data BMKG secara berkala
async function checkBmkgEarthquake() {
    try {
        const response = await axios.get(BMKG_API_URL);
        
        if (!response.data || !response.data.Infogempa || !response.data.Infogempa.gempa) {
            console.log('⚠️ Format data BMKG tidak sesuai atau kosong.');
            return;
        }

        const dataGempa = response.data.Infogempa.gempa;
        const currentGempaTime = `${dataGempa.Tanggal} - ${dataGempa.Jam}`;

        // Ekstraksi data detail dari BMKG untuk membuat payload CV2
        const tanggal = dataGempa.Tanggal || '-';
        const jam = dataGempa.Jam || '-';
        const magnitude = dataGempa.Magnitude || '-';
        const kedalaman = dataGempa.Kedalaman || '-';
        const koordinat = dataGempa.Koordinat || '-';
        const lintang = dataGempa.Lintang || '-';
        const bujur = dataGempa.Bujur || '-';
        const wilayah = dataGempa.Wilayah || '-';
        const potensi = dataGempa.Potensi || 'Tidak ada keterangan potensi.';
        const dirasakan = dataGempa.Dirasakan || 'Tidak dirasakan/belum ada laporan.';

        // --- KONFIGURASI EMOJI AMAN ---
        const ArrowEmoji = "🔹"; 
        const ClearMemoryButtonEmoji = "1118442091379445821"; 
        const RegenerateButtonEmoji = "1117026147281141761"; 
        const DonationButtonEmoji = "1376820961562595328"; 

        // --- PROSES STRUKTUR DATA DENGAN STYLE COMPONENTS V2 ---
        const container = new ContainerBuilder();
        const sep = new SeparatorBuilder();

        const textDisplay = new TextDisplayBuilder().setContent(
            `**🚨 BMKG • INFO GEMPA BUMI TERKINI**\n` +
            `Telah terjadi aktivitas gempabumi baru dengan rincian data sebagai berikut:\n\n` +
            `**${ArrowEmoji} Waktu Kejadian**\n` +
            `• Tanggal: **${tanggal}**\n` +
            `• Jam: **${jam}**\n\n` +
            `**${ArrowEmoji} Kekuatan & Kedalaman**\n` +
            `• Magnitudo: **${magnitude} SR**\n` +
            `• Kedalaman: **${kedalaman}**\n\n` +
            `**${ArrowEmoji} Titik Koordinat & Lokasi**\n` +
            `• Posisi: **${koordinat}** (${lintang} - ${bujur})\n` +
            `• Wilayah Pusat: **${wilayah}**\n\n` +
            `**${ArrowEmoji} Informasi Dampak**\n` +
            `• Potensi Dampak: **${potensi}**\n` +
            `• Wilayah Dirasakan (MMI): **${dirasakan}**\n\n` +
            `*Sumber Data: BMKG Indonesia (TEWS)*`
        );

        container.addTextDisplayComponents(textDisplay);
        container.addSeparatorComponents(sep);

        const buttonsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('clear_memory_gempa')
                .setLabel('Clear Memory')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(parseButtonEmoji(ClearMemoryButtonEmoji)),

            new ButtonBuilder()
                .setCustomId('regenerate_gempa')
                .setLabel('Regenerate')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(parseButtonEmoji(RegenerateButtonEmoji)),

            new ButtonBuilder()
                .setLabel('Website')
                .setStyle(ButtonStyle.Link)
                .setURL('https://bmkg.go.id/')
                .setEmoji(parseButtonEmoji(DonationButtonEmoji))
        );

        container.addActionRowComponents(buttonsRow);

        // Selalu simpan konfigurasi payload CV2 ke penampung cache global
        lastGempaPayload = {
            flags: MessageFlags.IsComponentsV2,
            components: [container]
        };

        // Jika ini adalah pengecekan pertama kali sejak bot dinyalakan
        if (lastGempaTime === null) {
            lastGempaTime = currentGempaTime;
            console.log(`📦 Mengunci data awal gempa terupdate: [${currentGempaTime}]`);
            return;
        }

        // JIKA TERDETEKSI GEMPA BARU (Waktu data API tidak sama dengan data memori bot)
        if (currentGempaTime !== lastGempaTime) {
            lastGempaTime = currentGempaTime; // Update data memori terbaru
            console.log(`🚨 Terdeteksi Gempa Baru! Mengirimkan log ke channel...`);

            // Cari channel Discord berdasarkan ID target
            const channel = await client.channels.fetch(TARGET_CHANNEL_ID);
            if (!channel) {
                console.log(`❌ Channel dengan ID ${TARGET_CHANNEL_ID} tidak ditemukan.`);
                return;
            }

            // Kirim log otomatis menggunakan interface Components V2 ke channel tujuan
            await channel.send(lastGempaPayload);
        }

    } catch (error) {
        console.error('⚠️ Gagal melakukan auto-check BMKG:', error.message);
    }
}

// Handler Interaksi untuk Button & Slash Command
client.on('interactionCreate', async (interaction) => {
    // 1. HANDLER JIKA INTERAKSI ADALAH SLASH COMMAND
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'reload') {
            try {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                // Tarik data terbaru ke memori payload
                await checkBmkgEarthquake();

                if (!lastGempaPayload) {
                    return await interaction.editReply({ content: '⚠️ Gagal mengambil data terbaru atau cache data BMKG kosong.' });
                }

                // Kirim ulang log data gempa ke channel tempat command ini diketik menggunakan data V2 terbaru
                await interaction.channel.send(lastGempaPayload);
                await interaction.editReply({ content: '✅ Berhasil mengirimkan ulang log data gempa bumi terbaru ke channel ini.' });
            } catch (err) {
                console.error(err);
                if (interaction.deferred) {
                    await interaction.editReply({ content: '❌ Terjadi kesalahan saat mencoba memproses ulang data.' });
                }
            }
        }
        return;
    }

    // 2. HANDLER JIKA INTERAKSI ADALAH BUTTON COMPONENTS
    if (interaction.isButton()) {
        if (interaction.customId === 'clear_memory_gempa') {
            lastGempaTime = null;
            await interaction.reply({ content: '✅ **Memory Berhasil Dihapus!** Bot akan menganggap pengecekan berikutnya sebagai data baru.', flags: MessageFlags.Ephemeral });
        } 
        
        else if (interaction.customId === 'regenerate_gempa') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            await checkBmkgEarthquake();
            
            // Perbarui komponen interaksi yang memicu agar tetap sinkron menggunakan layout V2 terbaru
            await interaction.editReply({ content: '🔄 **Sistem dipaksa mengecek ulang data API BMKG secara instan!**' });
        }
        return;
    }
});

client.on('error', console.error);

client.login(process.env.DISCORD_TOKEN);