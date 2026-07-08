"""
Amani AI — chatbot microservice for the Amani Bus Booking System.
Stack: Python + Flask.

Run:
    pip install flask flask-cors
    python amani_ai.py

This is a rule-based responder out of the box (works offline, no API cost).
To upgrade to a real LLM, set OPENAI_API_KEY and uncomment the OpenAI block
inside answer(), which will be used as a fallback whenever no rule matches.
"""
import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

RULES_EN = [
    (r"book|ticket|reserve", "To book: open 'Search Route', choose your From/To towns and date, pick a trip, select your seat, then confirm and pay. You'll get an SMS with your ticket code instantly."),
    (r"pay|payment|mpesa|tigo|airtel", "We support M-Pesa, Tigo Pesa, Airtel Money, and Visa/MasterCard. Choose your method at checkout — a successful payment triggers an instant SMS to your phone."),
    (r"sms|message", "Every confirmed booking automatically sends an SMS to the phone number you provide, with your ticket code, route, seat number and amount paid."),
    (r"route|arusha|dar|geita|kahama|mbeya", "We currently cover Arusha, Dar es Salaam, Geita, Kahama and Mbeya. Check 'Routes' for distances, or 'Time' for the full timetable."),
    (r"fare|price|cost", "Fares depend on route and class (VIP or Ordinary). Exact prices are shown per trip under 'Search Route' or the 'Time' timetable."),
    (r"seat", "After picking a trip you'll see a live seat map — grey seats are booked, white ones are free. Tap to select, tap again to deselect."),
    (r"refund|cancel", "For refunds or cancellations, visit the nearest booking office under 'Booking Offices', or contact the bus company with your ticket code."),
    (r"office|stand|terminal", "Bus stands and booking offices for all five towns are listed under 'Stands' and 'Booking Offices', with addresses and phone numbers."),
    (r"hi|hello|hey", "Hello! I'm Amani AI, your Amani Bus Booking assistant. Ask me about routes, fares, seats, payments, or how to book a ticket."),
]
RULES_SW = [
    (r"buki|tiketi", "Kubuki: fungua 'Tafuta Njia', chagua mji wa kuondoka/kwenda na tarehe, chagua safari, chagua kiti, thibitisha na lipa. Utapokea SMS na namba ya tiketi papo hapo."),
    (r"lipa|malipo|mpesa|tigo|airtel", "Tunapokea M-Pesa, Tigo Pesa, Airtel Money, na Visa/MasterCard. Malipo yakithibitishwa utapokea SMS papo hapo."),
    (r"sms|ujumbe", "Kila bukishi lililothibitishwa hutuma SMS kwenye namba uliyotoa, ikiwa na namba ya tiketi, njia, kiti na kiasi kilicholipwa."),
    (r"njia|arusha|dar|geita|kahama|mbeya", "Kwa sasa tunahudumia Arusha, Dar es Salaam, Geita, Kahama na Mbeya. Angalia 'Njia' au ratiba ya 'Muda'."),
    (r"bei|nauli", "Nauli hutegemea njia na aina ya basi (VIP au Ordinary). Bei halisi ipo kwenye 'Tafuta Njia' au 'Muda'."),
    (r"kiti", "Baada ya kuchagua safari utaona ramani ya viti — kijivu ni vilivyobukiwa, vyeupe viko wazi."),
    (r"ghairi|rejesha", "Kwa kughairi, tembelea ofisi ya kubuki iliyo karibu au wasiliana na kampuni ya basi ukitumia namba ya tiketi."),
    (r"ofisi|stendi|kituo", "Vituo na ofisi za kubuki za miji yote vimeorodheshwa chini ya 'Vituo' na 'Ofisi za Kubuki'."),
    (r"habari|mambo|hujambo", "Habari! Mimi ni Amani AI. Niulize kuhusu njia, nauli, viti, malipo, au jinsi ya kubuki tiketi."),
]

def answer(message: str, lang: str = "en") -> str:
    text = message.lower()
    rules = RULES_SW if lang == "sw" else RULES_EN
    for pattern, reply in rules:
        if re.search(pattern, text):
            return reply

    # --- Optional: fall back to a real LLM if configured ---
    # if os.getenv("OPENAI_API_KEY"):
    #     from openai import OpenAI
    #     client = OpenAI()
    #     resp = client.chat.completions.create(
    #         model="gpt-4o-mini",
    #         messages=[
    #             {"role": "system", "content": "You are Amani AI, a helpful assistant for the Amani Bus Booking System in Tanzania."},
    #             {"role": "user", "content": message}
    #         ]
    #     )
    #     return resp.choices[0].message.content

    if lang == "sw":
        return "Swali zuri. Naweza kusaidia na bukishi, viti, nauli, njia, ratiba, malipo, SMS, vituo na ofisi za kubuki."
    return "Great question. I can help with bookings, seats, fares, routes, timetables, payments, SMS confirmations, stands and booking offices."


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True)
    message = data.get("message", "")
    lang = data.get("lang", "en")
    return jsonify({"reply": answer(message, lang)})


if __name__ == "__main__":
    app.run(port=5001, debug=True)
