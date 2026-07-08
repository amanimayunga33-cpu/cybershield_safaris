# Amani Bus Booking System

A complete online bus ticket booking platform for Tanzania — built for the
Institute of Accountancy Arusha, Software Design module (CYU 07212).

Buses: **Amani Safaris, Blandina Safaris, Brian Safaris, Happynes Safaris, Machemba Safaris**
Routes: **Arusha, Dar es Salaam, Geita, Kahama, Mbeya**

## ⚠️ Important — about the "link to deploy"

I can't host a live public URL for you directly — I don't have internet/deployment
access in this environment. What I've given you instead is the **complete, working
codebase** plus a **fully interactive demo you can open right now** in any browser
(`frontend/index.html` — no install needed), so you can see and test every screen
immediately. Follow **"Deploying for real"** below to put it online (free options included).

## What's new in this version
- **Amani AI is now genuinely unrestricted** — it calls the Claude API directly (works automatically inside Claude.ai's artifact preview) and can discuss *anything*: sports, tech, coding, music, jokes, stories, casual chat — fluently, in any language, not just canned bus-related answers. If you deploy the frontend standalone (e.g. Netlify), point `AI_BACKEND_URL` (top of the AI script section in `index.html`) at your deployed backend's `/api/ai-chat` route (see `/backend`) so the chat keeps working outside Claude.ai.
- **Satellite map now defaults to Streets view** (OpenStreetMap — shows roads and city names) with a layer switcher (top-right "layers" icon) to flip to satellite imagery.
- **New Registrations screen**: register buses, routes, trips, terminals/stands, and optionally change fares on existing trips — everything updates live across Search, Time, Stands, and the map.
- **Company Buses**: Cybershield Safaris is seeded as the holding company owning Amani, Blandina, Brian, Happynes and Machemba Safaris; register new holding companies or new bus brands under any company.
- **Fully responsive**: tested with no horizontal overflow on iPhone SE (375px), small Android (360px), tablets (768px) and desktop — tables scroll horizontally instead of breaking, the ticket layout stacks on narrow screens, and inputs are sized to avoid iOS zoom-on-focus.
- **Redesigned homepage**: two-column hero with an animated illustrated bus, a "packed and ready" fleet strip, and a gold-accented visual style throughout (buttons, active tab, card hover, ticket stub). The moving bus on the route-line divider is now a small illustrated bus with spinning wheels instead of an emoji.

## What's new in this version
- **Amani AI now has a large built-in multilingual knowledge base** (jokes, Swahili proverbs, riddles, short stories, sports, tech/coding, music, capitals, arithmetic, greetings in 7+ languages) so he always has something good to say, even with no internet. He still tries the real Claude API first when available.
- **Amani AI recognizes you**: if you're registered/logged in, he greets you by name on your first message, and again after a 20-minute silence if you switch to a new topic — otherwise he just continues the conversation naturally.
- **Register Trip now supports typing OR picking a route** — type a brand-new route and its town coordinates are auto-detected via free OpenStreetMap geocoding (no manual lat/lng needed).
- **Company management**: add, edit, and delete buses per company; edit each holding company's phone, email, and headquarters address — all under Registrations / VAA.
- **Parcel & non-seat item booking**: inside Bookings, switch to "📦 Parcel / Non-seat Item" to ship a letter, phone, or package without a passenger seat. It gets its own `PKG-` tracking code (distinct from passenger `LOC-` codes) that shows the bus's live position for cargo security.
- **Editable booking offices, stands, and receipts**: office phone/address and stand details can be edited directly (Stands / Booking Offices screens, or centrally via VAA).
- **Richer receipts**: every ticket now shows the payment timestamp, the booking office's phone number, and a warm thank-you line from the operating company, alongside the ticket code, fare, and map code.
- **VAA — Video Assistant Admin**: a full admin control center (replaces the old simple Admin screen) with a live pulsing indicator and tabs for Buses, Stands, Booking Offices, Fare Changes, Companies, **Passengers** (name, gender, phone, seats, route, time), a **live bus tracker** (progress bar per trip based on real elapsed time), and Feedback.
- **Passenger feedback**: a public "Feedback" screen where passengers rate their trip and leave a comment, visible to other passengers and to VAA.
- **Real SMS via Netlify Functions**: see "Sending real SMS" below — deploy with the included function and SMS becomes real, not simulated.

## Sending real SMS (important)
By default, SMS is safely **simulated** (shown as a toast + logged) because a real SMS API key must never be exposed in frontend code — anyone could view the page source and steal it.
To send **real** SMS when deployed:
1. Push this whole folder to a GitHub repository.
2. On [netlify.com](https://netlify.com), choose "Import from Git" (not drag-and-drop — drag-and-drop skips serverless functions) and connect that repo. `netlify.toml` is already configured to publish `frontend/` and run `netlify/functions/`.
3. In Netlify → Site settings → Environment variables, add:
   - `AT_USERNAME` — your Africa's Talking username (`sandbox` for free testing)
   - `AT_API_KEY` — your Africa's Talking API key ([sign up free](https://africastalking.com))
   - `AT_SENDER_ID` — optional, an approved sender name
4. Redeploy. The frontend already calls `/.netlify/functions/send-sms` automatically — no code changes needed. If the function isn't reachable (e.g. you used drag-and-drop, or haven't set the keys yet), it safely falls back to the simulated SMS toast so booking still works end-to-end for testing.

## What's included

```
busapp/
├── frontend/
│   └── index.html          ← Open this directly in a browser. Full working demo:
│                              register, login, search, buses, routes, seats, booking,
│                              payment + simulated SMS, tickets, stands, offices, time,
│                              admin dashboard, Amani AI chat, EN/SW language toggle.
├── backend/
│   ├── server.js            ← Node.js + Express main API (recommended production stack)
│   ├── sms.js                ← Real SMS sending via Africa's Talking
│   ├── package.json
│   ├── .env.example           ← copy to .env and fill in your DB + SMS keys
│   ├── sql/schema.sql         ← MySQL database schema + seed data (buses, routes)
│   ├── php-api/                ← Alternative PHP+MySQLi API (for cPanel/shared hosting)
│   │   ├── db.php, register.php, login.php, book.php, sms.php
│   ├── python-ai/
│   │   └── amani_ai.py          ← "Amani AI" chatbot microservice (Flask)
│   └── java-utils/
│       └── BookingValidator.java ← Fare calculation & validation logic in Java
└── README.md (this file)
```

## 1. Try it immediately (no setup)

Just open `frontend/index.html` in any browser (double-click it, or drag it into
Chrome). Everything works client-side with realistic sample data:
- Search trips between the 5 towns, pick a bus, select a seat, pay, and watch the
  **simulated SMS** appear as a toast notification with the exact message that would
  be sent to the phone number you typed in.
- Click the floating 💬 button anywhere to chat with **Amani AI**.
- Click **🌐 Swahili** top-right to switch the whole interface to Kiswahili.

This demo stores data in memory only (resets on page reload) — it's meant to show
the complete user experience. The `backend/` folder is the real, persistent version.

## 2. Running the real backend locally

### Requirements
- Node.js 18+
- MySQL 8+ (or MariaDB)
- (Optional) Python 3.10+ for the Amani AI microservice
- (Optional) Africa's Talking account for real SMS — free sandbox at https://africastalking.com

### Steps
```bash
# 1. Create the database
mysql -u root -p < backend/sql/schema.sql

# 2. Configure environment
cd backend
cp .env.example .env
# edit .env: set DB_PASSWORD, JWT_SECRET, and AT_API_KEY/AT_USERNAME for real SMS

# 3. Install & run the Node API
npm install
npm start
# API now running at http://localhost:5000

# 4. (Optional) Run the Amani AI microservice
cd python-ai
pip install flask flask-cors
python amani_ai.py
# AI service now running at http://localhost:5001
```

Then point the frontend at your API (replace the in-memory demo functions in
`index.html` with `fetch()` calls to `http://localhost:5000/api/...` — the API
routes already match: `/api/register`, `/api/login`, `/api/trips`, `/api/bookings`,
`/api/my-tickets`, `/api/ai-chat`).

### SMS setup (real messages to phones)
1. Create a free account at https://africastalking.com
2. Get your sandbox `username` (usually `sandbox`) and `apiKey`
3. Put them in `backend/.env` as `AT_USERNAME` and `AT_API_KEY`
4. Test with a number registered in your AT sandbox — real SMS require moving to
   a paid AT account and a registered Sender ID (standard for Tanzanian SMS routes)

Without SMS credentials configured, the system automatically **simulates** SMS by
logging the message to the console — booking still works end-to-end.

## 3. Deploying for real (free/low-cost options)

**Frontend (`index.html`):**
- Easiest: drag-and-drop the `frontend` folder onto https://app.netlify.com/drop — get a live URL in seconds
- Or: GitHub Pages, Vercel, or Cloudflare Pages (all free, connect your GitHub repo)

**Backend (Node/Express + MySQL):**
- Railway.app or Render.com — both have free/low-cost tiers, one-click deploy from GitHub,
  and built-in MySQL/PostgreSQL add-ons
- Steps: push `backend/` to a GitHub repo → connect repo on Railway/Render → add a
  MySQL database add-on → paste your `.env` values into their dashboard's environment
  variables → deploy. You'll get a live API URL (e.g. `https://yourapp.up.railway.app`)

**PHP alternative (`php-api/`):**
- Works on any shared cPanel host (e.g. a Tanzanian hosting provider) — just upload
  the `php-api` folder and import `schema.sql` via phpMyAdmin

**Python AI microservice:**
- Deploy alongside the Node backend on Railway/Render, or as a separate small
  service; set `AI_SERVICE_URL` in the Node `.env` to point to it

Once both are deployed, update the `fetch()` base URLs in `index.html` to your
live backend URL, and re-deploy the frontend.

## 4. Extending the system
- Swap the rule-based Amani AI for a real LLM by setting `OPENAI_API_KEY` and
  uncommenting the OpenAI block in `python-ai/amani_ai.py`
- Add real payment gateway integration (Selcom, Flutterwave, or direct mobile money APIs)
- Add QR codes to tickets for conductor scanning at boarding
- Add the optional "Driver" portal described in the original proposal (view assigned trips)

## Technology stack (as requested)
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend (primary) | Node.js + Express |
| Backend (alternative) | PHP + MySQLi |
| AI microservice | Python + Flask |
| Business-logic utility | Java |
| Database | MySQL |
| SMS gateway | Africa's Talking |
