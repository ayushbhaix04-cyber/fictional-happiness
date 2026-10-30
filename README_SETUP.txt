MISSION FREE STUDY OFFICIAL — CLOUDFLARE + GITHUB + GEMINI

This version is prepared for Cloudflare Pages Functions. The website is index.html; the secure AI backend is in functions/api/. No Node server is needed and the Gemini key is NOT placed in GitHub or HTML.

ANDROID-ONLY DEPLOYMENT
1) Download this ZIP and extract it using your phone/tablet's Files app (or a ZIP extractor). You need the files/folders inside the ZIP, not the ZIP itself.
2) Open https://github.com in Chrome and sign in/create an account.
3) Create a new repository named mission-free-study-official. Public or Private is your choice. Do not add a README/license/gitignore during creation.
4) Open the empty repository, tap Add file > Upload files. Upload index.html, README_SETUP.txt, and the functions folder (including api/chat.js and api/health.js). If GitHub mobile web does not let you upload folders, create folders using Add file > Create new file and use these exact paths: functions/api/chat.js and functions/api/health.js; paste the contents from the matching files in this package. Commit to main.
5) Open https://dash.cloudflare.com and sign in/create an account.
6) Go to Workers & Pages > Create application > Pages > Connect to Git. Connect GitHub and authorize Cloudflare. Choose repository mission-free-study-official.
7) Build settings: Production branch = main; Framework preset = None; Build command = exit 0; Build output directory = / (a single slash, root). Save and Deploy.
8) When deployment completes, open the *.pages.dev URL. The site should load; AI will not answer until the secret is added.
9) In Cloudflare, open Workers & Pages > your Pages project > Settings > Variables and secrets (or Functions/Settings depending on dashboard view). Add a secret named GEMINI_API_KEY and paste your Gemini API key as its value. Save, then trigger a new deployment if Cloudflare asks.
10) Open https://YOUR-SITE.pages.dev/api/health . It should show configured:true. Then test Mission AI on your website with: What is electricity?

OPTIONAL MODEL: add a plain-text variable GEMINI_MODEL with value gemini-2.5-flash only if you need to override the default. Do not put the API key in a normal variable, GitHub file, HTML, screenshot, or chat.

UPDATES: edit files in GitHub and commit to main. Cloudflare Pages automatically deploys each new commit.

TROUBLESHOOTING
- 404 on site: confirm index.html is at repository root, not inside an extra nested folder.
- AI says not connected: check secret spelling GEMINI_API_KEY, then redeploy.
- API errors/429: check Gemini API key/project, model access, quota and current Google AI Studio terms.
- If GitHub mobile upload cannot upload folders, create the two function files using the exact paths above.

Security: Never expose the Gemini key in client-side code. Google recommends keeping keys out of source control and client applications. Public launch should add rate limiting/abuse protection and privacy notice. Free API quotas/terms can change.
