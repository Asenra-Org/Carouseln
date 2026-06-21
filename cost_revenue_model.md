# Cost & Revenue Model: Carouseln (Simplified Quota-Based Pricing)

Carouseln ek global, serverless micro-SaaS product hai. Hamne pricing model ko simple user-based and quota-based tiers me divide kiya hai, jahan users ko unke usage (carousels generated per month) ke according target kiya jayega.

---

## 1. Operational Cost Structure (Per Month)

Hamara backend pure serverless (Astro + Firebase + Gemini API) par built hai, isliye operational maintenance costs bilkul zero ke barabar hain.

### A. AI API Cost (Gemini 2.5 Flash)
* **Average Cost Per Generation**: ~$0.000675 (Matlab **$0.01 se 14 times kam!**)
* **Pro User (Max 100 generations/mo)**: Max API cost = **$0.0675 / user / month**
* **Agency User (Unlimited, avg 300/mo)**: Avg API cost = **$0.20 / user / month**

### B. Database & Auth (Firebase)
* **Database & Reads/Writes**: Avg DB cost = **$0.02 / user / month**

---

## 2. Updated Global Pricing Strategy

Hamari simplified global tier structure niche table me di gayi hai:

| Plan | Price (Monthly) | Usage & Features |
| :--- | :--- | :--- |
| **Free Tier** | **$0** | 1 Brand limit, 1 carousel generation per day, **Ad-supported (Ads dikhenge)**. |
| **Pro Tier** | **$8 / month** | Multiple Brands, **100 carousel generations per month**, Ad-free, high-res ZIP exports (no watermark). |
| **Agency Tier** | **$24 / month** | Multiple Brands, **Unlimited carousel generations per month**, Ad-free, priority generation speed. |

---

## 3. Financial Scenarios & Projections

Ye scenarios active paid subscribers ke numbers par structured hain.

### Scenario A: Conservative (Starting Stage)
* **Active Subscribers**:
  * Pro Plan ($8/mo): 150 users
  * Agency Plan ($24/mo): 15 users
* **Monthly Gross Revenue**:
  * Pro: 150 * $8 = $1,200
  * Agency: 15 * $24 = $360
  * **Total Revenue**: **$1,560 / month**
* **Monthly Operational Expenses**:
  * Gemini API (150 users * avg 40 gens = 6,000 gens): $4.00
  * Firebase DB (reads & writes): $3.00
  * Vercel Pro Hosting: $20.00
  * **Total Cost**: **$27 / month**
* **Net Profit**: **$1,533 / month (~98.2% Profit Margin)**

---

### Scenario B: Moderate (Product-Market Fit Stage)
* **Active Subscribers**:
  * Pro Plan ($8/mo): 800 users
  * Agency Plan ($24/mo): 80 users
* **Monthly Gross Revenue**:
  * Pro: 800 * $8 = $6,400
  * Agency: 80 * $24 = $1,920
  * **Total Revenue**: **$8,320 / month**
* **Monthly Expenses**:
  * Gemini API (approx 35,000 gens): $24.00
  * Firebase DB (approx 5M reads/writes): $10.00
  * Vercel Pro Hosting: $20.00
  * Transaction fees (Stripe/PayPal 3.5% avg): $291.00
  * **Total Cost**: **$345 / month**
* **Net Profit**: **$7,975 / month (~95.8% Profit Margin)**

---

### Scenario C: Optimistic (Viral / Scale Stage)
* **Active Subscribers**:
  * Pro Plan ($8/mo): 3,500 users
  * Agency Plan ($24/mo): 350 users
* **Monthly Gross Revenue**:
  * Pro: 3,500 * $8 = $28,000
  * Agency: 350 * $24 = $8,400
  * **Total Revenue**: **$36,400 / month**
* **Monthly Expenses**:
  * Gemini API (approx 160,000 gens): $108.00
  * Firebase DB (approx 20M reads/writes): $40.00
  * Vercel Pro Hosting: $20.00
  * Stripe Fees (3.5%): $1,274.00
  * Customer Support Tool: $50.00
  * **Total Cost**: **$1,492 / month**
* **Net Profit**: **$34,908 / month (~95.9% Profit Margin)**

---

## 4. Business Key Advantages

1. **Ads on Free Tier**: Free tier par Google AdSense ads show karke hum passive ad revenue bhi generate karenge, jo hamare database cost aur free users ke server cost ko cover karega.
2. **Pre-defined Limits (Pro Tier)**: 100 carousels/month ka caps rakhne se cost 100% predictable ho jati hai. Hame heavy usage abusers se koi tension nahi hogi.
3. **Virtually Zero Maintenance**: Serverless DB structure ki wajah se scaling auto-managed hai. Margin humesha 95% se upar hi rahega!

---

## 5. Consolidated Expenses & Cost Table (All Tiers)

Niche di gayi table me sabhi operational services ki costs aur paid/free limitations ko summarize kiya gaya hai:

| Expense Category | Service Provider | Cost Model / Price | When do we pay? |
| :--- | :--- | :--- | :--- |
| **AI LLM API** | Google AI Studio (Gemini 2.5 Flash) | Input: $0.075 / 1M tokens<br>Output: $0.30 / 1M tokens | Switch to paid tier before public launch to avoid rate limits and protect data privacy. |
| **Database & Auth** | Firebase (Spark Free -> Blaze Paid) | Spark: Free up to 50k reads/day<br>Blaze: Pay-as-you-go ($0.06/100k reads) | Paid when free daily quota (50,000 reads / 20,000 writes per day) is exceeded. |
| **Hosting** | Vercel (Hobby -> Pro) | Hobby: Free (Non-commercial)<br>Pro: $20/month per member | Paid when we officially deploy commercial code with a custom domain on Vercel. |
| **Payment Gateway** | Stripe / PayPal | 2.9% to 3.5% + $0.30 per transaction | Deducted automatically from user subscriptions on every checkout. |

---

## 6. API Key Transition & Commercial Production Phase

Abhi aapka project student/personal Google AI Studio API Key par chal raha hai. Yeh developmental phase ke liye perfect hai, lekin production/launch phase me transition mandatory hoga.

### A. Free/Student Key ke Risks & Limitations
* **Rate Limits (15 RPM / 1,500 RPD)**: Free keys me rate limits bahut low hoti hain. Agar 2-3 users ek sath carousel generate karenge, toh rate limit error (`429 Too Many Requests`) aa jayega.
* **Data Training Privacy**: Free tier me Google aapke inputs aur prompts ko analyze/train karne ke liye use kar sakta hai. Commercial app me users ka brand content public/train hone dena data privacy breach hai.
* **Commercial Restrictions**: Professional applications me production traffic ke liye free keys use karna recommend nahi kiya jata.

### B. Transition Triggers (Hame paid key par kab switch karna hai?)
Aapko Google Cloud / AI Studio me billing attach karke **Pay-as-you-go Paid Key** par switch karna hoga jab:
1. **Public Launch / Beta Stage**: Jaise hi app ko test karne ke liye 10+ active users register karenge, concurrency hit hone se bachaane ke liye switch karein.
2. **Commercial Transactions Begin**: Pehla premium user pay karte hi aapki data privacy requirements strict ho jati hain.
3. **High Volume Production**: Jab daily generations 500+ cross karne lagen.

### C. Paid Tier API Expected Expense (Gemini 2.5 Flash)
Gemini 2.5 Flash pricing bohot aggressive aur affordable hai:
* **Per Carousel Generation Token Size**: Input (~5,000 tokens), Output (~1,000 tokens).
* **Cost Per Generation**: ~**$0.000675** (0.05 Paise INR per generation).
* **$1.00 (~₹84) me Generations**: **~1,480 Carousel Generations!**
* **Monthly Active Users (MAU) billing target**: Agar 1,000 Pro users 100 generations per month poori limits use karte hain (Total 100,000 generations), toh API ka monthly bill sirf **$67.50 (~₹5,600)** aayega.

