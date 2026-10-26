"""
CHATBOT.PY — Backend AI Assistant "Lombok24jamSupport"
Mendukung:
1. REST API Server (Flask) untuk terhubung langsung dengan script.js di Browser
2. Mode Terminal Interaktif (CLI) jika dijalankan tanpa Flask
"""

from datetime import datetime

BOT_NAME = "Lombok24jamSupport"

# Basis Pengetahuan (Knowledge Base) Destinasi Wisata Lombok
KNOWLEDGE_BASE = {
    "pantai tanjung aan": {
        "kategori": "Pantai",
        "lokasi": "Lombok Tengah, NTB",
        "jam": "Buka 24 Jam",
        "tiket": "Gratis (Parkir Motor Rp 5.000, Mobil Rp 10.000)",
        "deskripsi": "Terkenal dengan pasir putih unik seperti merica, air laut jernih, dan dikelilingi bukit hijau Merese.",
        "fasilitas": "Area parkir, warung makan, gazebo, sewa snorkeling, toilet, spot foto."
    },
    "pantai kuta mandalika": {
        "kategori": "Pantai",
        "lokasi": "Lombok Tengah, NTB",
        "jam": "Buka 24 Jam",
        "tiket": "Gratis (Motor Rp 5.000, Mobil Rp 10.000, Bus Rp 20.000)",
        "deskripsi": "Pantai ikonik di kawasan Mandalika dengan garis pantai luas dan perbukitan hijau.",
        "fasilitas": "Area parkir, warung makan, gazebo, toilet, mushola, spot foto."
    },
    "pantai pink": {
        "kategori": "Pantai",
        "lokasi": "Lombok Timur, NTB",
        "jam": "Buka 24 Jam",
        "tiket": "Rp 10.000 (Domestik) / Rp 50.000 (Asing)",
        "deskripsi": "Pantai Tangsi dengan pasir berwarna merah muda alami dari serpihan karang merah.",
        "fasilitas": "Parkir, warung makan, gazebo, sewa snorkeling & perahu wisata, mushola."
    },
    "bukit merese": {
        "kategori": "Bukit",
        "lokasi": "Lombok Tengah, NTB",
        "jam": "05.00 - 19.00 WITA",
        "tiket": "Rp 10.000 / orang",
        "deskripsi": "Spot sunrise dan sunset terbaik dengan panorama laut lepas dan Pantai Tanjung Aan dari ketinggian.",
        "fasilitas": "Area parkir, warung makan, gazebo, toilet, spot foto."
    },
    "gunung rinjani": {
        "kategori": "Gunung",
        "lokasi": "Lombok Timur / Utara, NTB",
        "jam": "Sesuai jadwal kuota pendakian TNGR",
        "tiket": "Rp 50.000 (Weekdays), Rp 75.000 (Weekend), Rp 25.000 (Pelajar/Mahasiswa)",
        "deskripsi": "Gunung berapi tertinggi kedua di Indonesia (3.726 mdpl) dengan kaldera Danau Segara Anak.",
        "fasilitas": "Basecamp registrasi, pos pendakian, area camping, sumber air, toilet."
    },
    "danau segara anak": {
        "kategori": "Danau",
        "lokasi": "Kaldera Gunung Rinjani, Lombok Timur",
        "jam": "Mengikuti jadwal TNGR",
        "tiket": "Rp 25.000 - Rp 75.000 / orang",
        "deskripsi": "Danau kawah menakjubkan di ketinggian Rinjani dengan sumber air panas alami dan Gunung Barujari.",
        "fasilitas": "Area camping, jalur pendakian, sumber air, spot foto."
    },
    "air terjun benang stokel": {
        "kategori": "Air Terjun",
        "lokasi": "Lombok Tengah, NTB",
        "jam": "07.30 - 17.00 WITA",
        "tiket": "Rp 10.000 / orang",
        "deskripsi": "Dua air terjun ikonik di kaki Rinjani dengan aliran menyerupai untaian benang dan tirai hijau.",
        "fasilitas": "Area parkir, tempat makan, toilet, mushola, spot foto."
    }
}


def generate_bot_response(user_message: str) -> str:
    """Fungsi utama pemroses pesan pengguna untuk Lombok24jamSupport."""
    pesan = user_message.lower().strip()

    # 1. Cek kecocokan langsung di Knowledge Base
    for key, info in KNOWLEDGE_BASE.items():
        if key in pesan:
            return (
                f"✨ **{key.title()}** ({info['kategori']})\n"
                f"📍 Lokasi: {info['lokasi']}\n"
                f"🕒 Jam Buka: {info['jam']}\n"
                f"🎟️ Tiket Masuk: {info['tiket']}\n"
                f"📖 Deskripsi: {info['deskripsi']}\n"
                f"✅ Fasilitas: {info['fasilitas']}\n\n"
                f"Klik tombol **BOOKING NOW** pada kartu wisata untuk memesan tiket kunjungan Anda!"
            )

    # 2. Cek Template Eksplorasi Kategori
    if "pantai" in pesan:
        return (
            "🏖️ **Rekomendasi 8 Pantai di Lombok:**\n"
            "1. Pantai Tanjung Aan\n2. Pantai Kuta Mandalika\n3. Pantai Selong Belanak\n"
            "4. Pantai Mawun\n5. Pantai Pink\n6. Pantai Senggigi\n7. Pantai Mangsit\n8. Pantai Nambung\n\n"
            "Ketik nama pantai yang ingin Anda tanyakan!"
        )
    if "bukit" in pesan or "sunset" in pesan:
        return (
            "🌄 **Rekomendasi 7 Bukit Panorama di Lombok:**\n"
            "1. Bukit Selong\n2. Bukit Pergasingan\n3. Bukit Malimbu\n4. Bukit Anak Dara\n"
            "5. Bukit Batu Idung\n6. Bukit Merese\n7. Bukit Nipah"
        )
    if "air terjun" in pesan:
        return (
            "💧 **Rekomendasi 8 Air Terjun di Lombok:**\n"
            "1. Air Terjun Jeruk Manis\n2. Air Terjun Timponan\n3. Air Terjun Tibu Atas\n"
            "4. Air Terjun Kerta Gangga\n5. Air Terjun Semporonan\n6. Air Terjun Gunung Janggot\n"
            "7. Air Terjun Pancor Kopong\n8. Air Terjun Benang Stokel & Benang Kelambu"
        )
    if "gunung" in pesan or "rinjani" in pesan:
        return (
            "🌋 **Daftar Wisata Gunung di Lombok:**\n"
            "1. Gunung Rinjani (3.726 mdpl)\n2. Gunung Barujari\n"
            "3. Gunung Sangkareang\n4. Gunung Kondo"
        )
    if "danau" in pesan:
        return (
            "🏞️ **Daftar Wisata Danau di Lombok:**\n"
            "1. Danau Segara Anak\n2. Danau Biru Karang Sidemen\n"
            "3. Danau Gili Meno\n4. Telaga Biru Gunung Paok"
        )
    if "booking" in pesan or "bayar" in pesan:
        return (
            "🎟️ **Panduan Booking Tiket Wisata Lombok:**\n"
            "1. Klik kartu foto wisata (VISIT NOW).\n"
            "2. Pilih tombol **BOOKING NOW**.\n"
            "3. Isi Nama, No. HP, Alamat, Jumlah Orang, dan Metode Pembayaran.\n"
            "4. Struk resmi otomatis muncul dan siap dicetak!"
        )

    waktu = datetime.now().strftime("%H:%M WITA")
    return (
        f"Halo! Saya **{BOT_NAME}** (Aktif {waktu}).\n"
        "Silakan pilih template topik di bawah atau ketik nama wisata seperti "
        "'Pantai Tanjung Aan', 'Pantai Pink', 'Bukit Merese', atau 'Gunung Rinjani'."
    )


# Jalankan sebagai Server Flask API jika Flask terinstal, atau CLI jika tidak ada Flask
if __name__ == "__main__":
    try:
        from flask import Flask, request, jsonify
        from flask_cors import CORS

        app = Flask(__name__)
        CORS(app)

        @app.route("/api/chat", methods=["POST"])
        def chat_endpoint():
            data = request.get_json(silent=True) or {}
            user_msg = data.get("message", "")
            reply = generate_bot_response(user_msg)
            return jsonify({
                "bot_name": BOT_NAME,
                "reply": reply,
                "status": "online_24_hours"
            })

        print(f"====================================================")
        print(f"🚀 Server {BOT_NAME} aktif di http://127.0.0.1:5000")
        print(f"====================================================")
        app.run(host="127.0.0.1", port=5000, debug=True)

    except ImportError:
        print(f"====================================================")
        print(f"🤖 Mode Terminal {BOT_NAME} (Ketik 'keluar' untuk berhenti)")
        print(f"Tips: Install Flask (`pip install flask flask-cors`) untuk mode Web API.")
        print(f"====================================================")
        while True:
            msg = input("\nAnda: ")
            if msg.lower() in ["keluar", "exit", "quit"]:
                print(f"{BOT_NAME}: Sampai jumpa di Lombok! 🏝️")
                break
            print(f"\n{BOT_NAME}:\n{generate_bot_response(msg)}")