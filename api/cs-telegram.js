    export default async function handler(req, res) {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const adminChatId = process.env.TELEGRAM_CHAT_ID;
    
        if (!token || !adminChatId) {
        return res.status(500).json({ error: 'Token Telegram atau Chat ID belum diset di Vercel' });
        }
    
        // 1. MENGIRIM PESAN DARI PENGUNJUNG WEB KE TELEGRAM ADMIN (POST)
        if (req.method === 'POST') {
        try {
            const { sessionId, nama, message } = req.body;
            const teksTelegram = `🚨 *PESAN CS WISATA LOMBOK*\nID Sesi: #${sessionId}\n👤 Nama: ${nama}\n💬 Pesan: ${message}\n\n_(Swipe / Klik Reply langsung pada pesan ini untuk membalas ke layar web pengunjung)_`;
    
            const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminChatId,
                text: teksTelegram,
                parse_mode: 'Markdown'
            })
            });
    
            const data = await tgRes.json();
            if (!data.ok) {
            return res.status(500).json({ error: data.description });
            }
            return res.status(200).json({ ok: true });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
        }
    
        // 2. MENARIK BALASAN DARI ADMIN TELEGRAM KE LAYAR WEB PENGUNJUNG (GET)
        if (req.method === 'GET') {
        try {
            const { sessionId, after, since } = req.query;
            const afterId = parseInt(after || '0', 10);
            const sinceTime = parseInt(since || '0', 10);
    
            // Ambil riwayat update terbaru dari bot Telegram
            const tgRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=50`);
            const data = await tgRes.json();
    
            if (!data.ok) {
            return res.status(500).json({ error: 'Gagal menarik pesan Telegram' });
            }
    
            const replies = [];
            for (const item of data.result) {
            const msg = item.message;
            if (!msg || !msg.text) continue;
    
            // Filter agar hanya mengambil pesan baru pada sesi yang sedang aktif
            if (msg.message_id <= afterId) continue;
            if (sinceTime > 0 && msg.date < sinceTime) continue;
    
            const replyToText = msg.reply_to_message?.text || '';
            const cocokReply = replyToText.includes(`#${sessionId}`);
            const cocokTagManual = msg.text.includes(`#${sessionId}`);
    
            if (cocokReply || cocokTagManual) {
                const bersihTeks = msg.text.replace(`#${sessionId}`, '').trim();
                replies.push({
                id: msg.message_id,
                text: bersihTeks
                });
            }
            }
    
            return res.status(200).json({ replies });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
        }
    
        return res.status(405).json({ error: 'Method not allowed' });
    }