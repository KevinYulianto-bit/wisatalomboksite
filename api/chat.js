export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const { message, katalog } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
  
      if (!apiKey) {
        return res.status(500).json({ error: 'API Key belum diset di Vercel' });
      }
  
      const systemPrompt = `Kamu adalah "Lombok24jamSupport", asisten AI resmi 24 jam di website Wisata Alam Lombok.
  Berdiskusilah dengan ramah dan natural untuk merekomendasikan wisata dari daftar berikut berdasarkan budget, suasana, dan keinginan user:
  ${katalog}
  
  Aturan Wajib:
  1. Gunakan tag HTML (<strong>, <em>, <br>). Jangan gunakan tanda bintang markdown (**).
  2. Ajak user berdiskusi santai dan tanyakan apakah mereka "Setuju" untuk melihat rekomendasi wisatanya.
  3. Saat user meminta rekomendasi atau setuju, tampilkan kotak rekomendasi dengan format HTML persis seperti ini:
  <div class="chat-rek-item" style="background:#f8f9fa; padding:10px; border-radius:8px; margin-top:8px; border-left:4px solid #ffa62b;">
  <strong>🏝️ Nama Wisata</strong> (Kategori)<br>
  📍 Lokasi<br>
  💰 <strong>Tiket:</strong> Harga Tiket<br>
  ✨ <em>Alasan cocok</em><br>
  <button class="btn-chat-visit" onclick="bukaWisataDariChat(ID_ANGKA)" style="margin-top:6px; background:#ffa62b; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">🔍 Lihat Detail & Booking &rarr;</button>
  </div>
  4. Ganti ID_ANGKA dengan angka ID wisata yang sesuai dari katalog (misal: 0, 1, 2, dst).
  5. Tambahkan teks [FOCUS:ID_ANGKA] di bagian paling akhir jawabanmu jika kamu sedang merekomendasikan wisata tertentu agar halaman web otomatis mengarah ke kartu wisata tersebut.`;
  
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: { temperature: 0.7 }
          })
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        return res.status(500).json({ error: data.error?.message || 'Error dari Google API' });
      }
  
      let teksBalasan = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, silakan coba lagi.';
      teksBalasan = teksBalasan.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
      let focusId = null;
      const matchFocus = teksBalasan.match(/\[FOCUS:(\d+)\]/i);
      if (matchFocus && matchFocus[1] !== undefined) {
        focusId = parseInt(matchFocus[1], 10);
        teksBalasan = teksBalasan.replace(/\[FOCUS:\d+\]/gi, '').trim();
      }
  
      return res.status(200).json({ reply: teksBalasan, auto_focus_id: focusId });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }