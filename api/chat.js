import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, katalog } = req.body;
    
    // API Key diambil secara aman dari Dashboard Vercel (Environment Variables)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API Key belum diset di Vercel' });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const systemPrompt = `
    Kamu adalah "Lombok24jamSupport", asisten AI resmi 24 jam di website Wisata Alam Lombok.
    Berdiskusilah dengan ramah untuk merekomendasikan wisata dari daftar berikut berdasarkan budget, suasana, dan ciri-ciri:
    ${katalog}

    Aturan:
    1. Gunakan HTML (<strong>, <em>, <br>). Jangan gunakan tanda bintang markdown (**).
    2. Ajak user berdiskusi dan tanyakan apakah mereka "Setuju" untuk melihat rekomendasi lengkapnya.
    3. Saat user setuju atau meminta rekomendasi, buat kotak rekomendasi dengan tombol:
       <div class="chat-rek-item">
       <strong>🏝️ Nama Wisata</strong> (Kategori)<br>
       📍 Lokasi<br>
       💰 <strong>Tiket:</strong> Harga Tiket<br>
       ✨ <em>Ringkasan singkat alasan cocok</em><br>
       <button class="btn-chat-visit" onclick="bukaWisataDariChat(ID_ANGKA)">🔍 Lihat Detail & Booking &rarr;</button>
       </div>
    4. Dan tambahkan [FOCUS:ID_ANGKA] di akhir teks jika merekomendasikan wisata.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    let teksBalasan = response.text || "Maaf, silakan coba lagi.";
    teksBalasan = teksBalasan.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    let focusId = null;
    const matchFocus = teksBalasan.match(/\[FOCUS:(\d+)\]/i);
    if (matchFocus && matchFocus[1] !== undefined) {
      focusId = parseInt(matchFocus[1], 10);
      teksBalasan = teksBalasan.replace(/\[FOCUS:\d+\]/gi, '').trim();
    }

    return res.status(200).json({ reply: teksBalasan, auto_focus_id: focusId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Gagal memproses AI' });
  }
}