# TVK Grievance Redressal Portal (மக்கள் குறைதீர்ப்பு பிரிவு)

A modern, responsive, and bilingual public grievance registration portal built for the **TVK IT Wing (`@26_tvk_it_wing_`)**. This web application allows residents of Tamil Nadu to register complaints with various government departments. 

The backend automatically consolidates complainants' details into a central Excel sheet and compiles each grievance into a print-ready Microsoft Word (`.docx`) document.

---

## 🌟 Key Features

1. **Bilingual User Interface**: Supports both **Tamil (தமிழ்)** and **English** for broad accessibility.
2. **Multi-Step Grievance Form**: Beautifully styled stepper with validation, ensuring high-quality user submissions.
3. **Automatic Document Generation**:
   - Compiles user details, address, department, and problem into a structured `.docx` Word file.
   - Appends complainant details and status into a central Excel (`.xlsx`) sheet database.
4. **Secure Admin Control Room (`admin.html`)**:
   - Password-protected administrative dashboard.
   - Real-time analytical counters for metrics (Total, Pending, In Progress, Resolved).
   - Dynamic search, filter by department, district, or grievance status.
   - Direct browser download links for the consolidated Excel sheet and individual Word documents.
   - Inline status updates (Pending ➔ In Progress ➔ Resolved) which automatically sync with the Excel sheet.
5. **Glassmorphism Theme**: Premium, modern interface themed in **TVK's brand colors** (Maroon & Golden Yellow) with automatic system/manual dark-mode support.

---

## 💻 Local Development Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v16 or higher recommended).

### 2. Installation
Extract the project code, navigate to the folder, and run:
```bash
npm install
```

### 3. Configuration
Create or edit the `.env` file in the root directory:
```env
PORT=3000
ADMIN_PASSWORD=TVKitwing2026
```
*Modify `ADMIN_PASSWORD` to your desired secure passphrase.*

### 4. Run the Application
Start the server:
```bash
npm start
```
Open your browser and navigate to:
- **User Portal**: [http://localhost:3000](http://localhost:3000) (To file grievances)
- **Admin Control Room**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html) (Password: `TVKitwing2026`)

---

## 🚀 Deployment Guide for Render

Deploying this Node.js application to [Render](https://render.com) is straightforward. Follow these steps:

### Step 1: Upload to Git (GitHub/GitLab)
Create a private or public repository on GitHub and push the code:
```bash
git init
git add .
git commit -m "Initial commit of TVK Grievance Portal"
# Push to your remote repo
```

### Step 2: Create a Web Service on Render
1. Log in to your **Render Dashboard**.
2. Click **New +** and select **Web Service**.
3. Connect your Git repository.
4. Set the following configuration:
   - **Name**: `tvk-grievance-portal` (or any custom name)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or any paid tier)

### Step 3: Configure Environment Variables
In the Render Web Service page:
1. Go to the **Environment** tab.
2. Click **Add Environment Variable** and enter:
   - Key: `ADMIN_PASSWORD`
   - Value: `YourSecurePasswordForITWing`
3. Click **Save Changes**.

### Step 4: Add Persistent Storage (Highly Recommended)
Render's default free disk is **ephemeral**, meaning files saved on the disk (like the complaints Excel sheet and Word docs) will be deleted whenever the server restarts (which happens at least once a day or on code changes).

To save complaints permanently:
1. Go to the **Disks** tab of your Render Web Service.
2. Click **Add Disk**.
3. Configure the disk:
   - **Name**: `tvk-data-volume`
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: `1 GB` (More than enough for thousands of files on the free/hobby tier)
4. Click **Create Disk**.

*Note: Once the disk is mounted, your files will remain safe and persist across server restarts.*

---

## 📁 Project Directory Structure
```
tvk-complaint-portal/
├── data/                      # Contains database files (Auto-generated)
│   ├── complaints.json        # Complainant metadata database
│   ├── complaints.xlsx        # Consolidated Excel spreadsheet
│   └── docx/                  # Folder containing individual Word (.docx) documents
├── public/                    # Webpage static assets
│   ├── index.html             # User complaint form (Bilingual)
│   ├── admin.html             # Administrative control room
│   ├── style.css              # Custom styled sheets (TVK Palette)
│   ├── app.js                 # Frontend stepper validation & submission
│   └── admin.js               # Admin authentication and tables mapping
├── utils/                     # Utility services
│   ├── docxGenerator.js       # Auto-compiles Word file
│   └── excelGenerator.js      # Auto-syncs JSON records to Excel
├── .env                       # Environment credentials
├── server.js                  # Primary entry Express server
└── package.json               # Dependecy manager
```

---

## 👥 IT Wing Management Guidelines

When complaints are filed, they will appear immediately on the admin dashboard.
1. **Downloading Excel**: To download all user info (names, contact numbers, addresses, and status) in a single Excel file, click **Excel கோப்பாகப் பதிவிறக்கு** at the top of the dashboard.
2. **Generating Word Documents**: When forwarding complaints to a government official or printing them, click the **Word Doc** button on the row. It downloads a pre-formatted letter template with the official TVK header.
3. **Updating Status**: To keep track of progress, open the complaint details in the modal, select a new status (e.g. `In Progress` or `Resolved`), and click **Save**. This updates the status in the main Excel sheet instantly.
