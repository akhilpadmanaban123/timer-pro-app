

** AI-Powered Flash Sale & Evergreen Timer**
Hey there! This is a high-conversion Shopify app designed to create urgency that actually works. Unlike standard timers that reset every time a page refreshes, this app uses smart session tracking and AI to deliver a personalized experience for every shopper.

1. **The "Smart" Evergreen Logic**
Most apps use a fixed date for everyone. Our app features Evergreen sessions. When a new user lands on the site, the app checks their localStorage. If it's their first visit, it starts a unique 30-minute clock just for them. This creates a "sticky" session where the timer persists even if they refresh the page or navigate away, making the "limited time offer" feel genuine and urgent.

2.** AI Copywriting via OpenRouter**
We don't expect merchants to be expert marketers. I integrated OpenRouter (fetching models like GPT/Gemini) to automatically generate high-conversion headlines.

For Fixed Sales, the AI generates global "Flash Sale" urgency.

For Evergreen Sales, the AI creates "Personalized Discount" messaging.

3.** Real-Time Analytics Dashboard**
The app doesn't just show a timer; it tracks performance. Using a Shopify App Proxy, every time the timer appears on a customer's screen, the backend increments an "Impression" count in MongoDB. This gives the merchant immediate feedback on how many eyeballs are seeing their offers.

🛠️ Tech Stack & Architecture
**Frontend**: React + Shopify Polaris (Admin) and Liquid + JavaScript (Storefront).

**Backend**: Node.js & Express.

**Database**: MongoDB (to store campaign data and analytics).

**AI**: OpenRouter API for dynamic content generation.

**Storefront Integration**: App Bridge & App Proxy for secure, fast data fetching.

🎨 Visual Themes
I built two distinct visual identities into the Liquid block to help the merchant's branding:

The "Urgency" Theme (Fixed): A pulsing red/orange gradient designed for store-wide events.

The "Premium" Theme (Evergreen): A glassmorphism-style blue/purple gradient designed for personalized new-user welcome offers.

📺 Demo Guide (Video Script)
Dashboard Start: "Here is our Flash Sale Dashboard. You can see we are tracking impressions in real-time."

AI Generation: "Watch as the AI generates a title for our new 30-minute Evergreen campaign using OpenRouter."

Global Targeting: "I'm setting this for 'All Products' so it shows up on our Home Page."

Live Proof: "On the storefront, the timer is live. If I refresh the page, you'll see the time doesn't reset—it's a true Evergreen session for this specific user."

Analytics Update: "Back in the dashboard, our view count has updated, proving the App Proxy is working perfectly."

Would you like me to add a "Troubleshooting" section to the bottom of this README just in case the reviewer has questions about the API setup?


**TimerPro**: AI-Powered Urgency for ShopifyThis project was built for the Shopify Developer Assessment. It’s a full-stack MERN application that allows merchants to deploy high-conversion countdown timers—both global "Flash Sales" and personalized "Evergreen" sessions—using AI to handle the marketing copy.

**🚀 Setup Instructions**
**Environment Variables**: 
Create a .env file in the web/ directory with:
MONGODB_URI: Your Atlas connection string.
OPENAIROUTER_API_KEY: Your OpenRouter key.
OPENAI_MODEL_NAME: e.g., openai/gpt-3.5-turbo.
Install Dependencies: Run npm install in the root directory.
Local Dev: Run shopify run dev. This will launch the Shopify CLI, sync the Theme App Extension, and start the Node.js backend.

**Preview**: Open your development store and add the "Global Flash Sale" block via the Theme Editor.

**Architecture Decisions**
**1. The MERN Pattern & Multi-TenancyI** chose the MERN stack (MongoDB, Express, React, Node) to maintain a clear separation of concerns. 
**Data Isolation:** 
1. Every document in the MongoDB collection is indexed by the shop domain. 
2. This ensures that even in a multi-tenant environment, a merchant's data is isolated and lookups remain good.
3. Schema Flexibility: I used a single Timer model to handle two different logic types. By storing the endDate as a string, I can toggle between a static ISO date for "Fixed" timers and a minute-duration for "Evergreen" timers.
4. Storefront: Theme App Extensions vs. ScriptTagsInstead of using legacy ScriptTags, I used Theme App Extensions.

**Performance:** Extensions allow Shopify to manage the liquid rendering, which helps avoid Cumulative Layout Shift (CLS). **App Proxy:** I used an App Proxy to bridge the storefront and my backend. This avoids CORS issues and allows for secure, authenticated data fetching. 
**AI Strategy & OpenRouter**: For the AI requirement, I integrated OpenRouter to provide an "Assistant" experience in the admin dashboard.Model Choice: I used xiaomi finetuned model freely available in openrouter page. They offer the best balance between creative marketing copy and low latency. 
**Assistance vs. Automation:** Following the PRD, the AI generates suggestions (Title, Description, Duration) based on merchant intent, but it never auto-saves. 9999The merchant must review and edit the copy before it goes live.
**Trade-offs:** While calling an LLM adds about 1–2 seconds of latency to the dashboard, the value of having "pre-written" high-converting copy outweighs the slight delay. 
**Assumptions & Trade-offs**
**Evergreen Persistence:** I assumed that localStorage is the best balance for session tracking. While a cookie-based server-side session is more "secure," localStorage provides a zero-latency experience for the customer. 

**Analytics**: I chose to track "Impressions" (views). In a production app, I would also track "Conversions" (clicks/sales) to show the merchant a true ROI. 
**Styling**: I opted for Tailwind-style CSS within the Liquid block to keep the bundle size under the 30KB limit specified in the PRD. What I’d Improve with More TimeUnit Testing: I would implement at least 5 meaningful unit tests covering the Evergreen time calculation and the API input sanitization. 
**Smart Scheduling**: I'd enhance the AI to suggest specific "Power Hours" for the sale based on the store's peak traffic times. 
**Testing**: Allowing merchants to run two AI-generated headlines simultaneously to see which drives more urgency. 
