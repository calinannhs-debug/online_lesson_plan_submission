# CNHS Online Lesson Plan Submission Portal

This package contains:
- `index.html` — the teacher-facing website.
- `GoogleAppsScript.gs` — the server-side script that records submissions in Google Sheets.

## Part A — Create the submission spreadsheet
1. Sign in to the Google account authorized by the school.
2. Create a blank Google Sheet, for example: **CNHS Lesson Plan Submissions**.
3. In the Sheet, open **Extensions → Apps Script**.
4. Replace the editor contents with the code in `GoogleAppsScript.gs`.
5. Click **Save**.

## Part B — Deploy the receiving script
1. In Apps Script, click **Deploy → New deployment**.
2. Select the gear icon / deployment type **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** according to school policy. For a school-managed deployment, choose the narrowest access that allows intended teachers to submit. If teachers use different accounts, confirm the selected access works for them.
5. Click **Deploy**, authorize the script, and copy the Web App URL ending in `/exec`.

Important: use a school-authorized Google account and follow DepEd/school privacy and data-retention policies. Limit spreadsheet access to authorized personnel only.

## Part C — Connect the website
1. Open `index.html` in VS Code.
2. Find this line near the bottom:
   `const SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";`
3. Replace the placeholder with the Web App URL copied in Part B. Keep the quotation marks.
4. Save the file.

## Part D — Test before publishing
1. Open `index.html` in a browser (or use the VS Code Live Server extension).
2. Submit a test lesson plan using clearly marked test information.
3. Open the Google Sheet and verify that a new row appears.
4. If it does not appear, check the Apps Script deployment access, URL, and execution logs. Do not collect real teacher submissions until the test succeeds.

## Part E — Publish online
You can publish the static website files using GitHub Pages:
1. Create a GitHub repository, e.g. `cnhs-lesson-plan-submission`.
2. Upload `index.html` to the repository root.
3. Open **Settings → Pages**.
4. Under Build and deployment, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
5. Wait for GitHub Pages to publish and open the displayed website URL.

Only the HTML page is hosted on GitHub Pages; Google Apps Script receives the form submissions and stores them in the Google Sheet.

## Customizing the school logo
The round `CNHS LOGO` mark in the header is a placeholder, not the official school logo. If you have the official logo image, place it in the project folder as `school-logo.png`, then replace the placeholder `<div class="logo">...</div>` with:
`<img src="school-logo.png" alt="Calinan National High School logo" class="school-logo">`
Add this CSS:
`.school-logo { width:68px; height:68px; object-fit:contain; background:white; border-radius:50%; padding:4px; }`

## Important limitations and privacy
- The browser uses a simple POST request and cannot verify the Apps Script response because it uses `no-cors`. The success notice therefore means the request was sent, not independently confirmed. Always test the live workflow and check the spreadsheet.
- This starter version does not upload lesson-plan documents. Teachers enter the lesson plan details in the online fields.
- Do not place confidential student information in lesson plan fields.
- Have the school ICT coordinator review access settings, privacy notice, retention, and authorization before public launch.
