completed full app with almoset all features some of featutre is yet to be furnished and ui is yet to be furnished 
# Rakshak App Tab Structure & Features

## 1. 🏠 HOME TAB (`app/(tabs)/home.tsx`)

**Primary Purpose**: Dashboard with quick access to critical information

### Key Features:
- **Expiry Alerts Dashboard**
  - Medicines expiring in next 7/30 days
  - Critical alerts (expired medicines)
  - Color-coded urgency indicators

- **Quick Stats Cards**
  - Total active medicines
  - Medicines expiring soon
  - Pending reminders
  - Recent scans count

- **Quick Actions**
  - Quick scan button
  - Add medicine manually
  - Voice search medicine
  - Emergency medicine finder

- **Recent Activity Feed**
  - Last 5 scanned medicines
  - Recent reminders
  - AI chat summaries

### Database Tables Used:
- `medicines` (active medicines, expiry dates)
- `reminders` (upcoming notifications)
- `user_activities` (recent actions)
- `scans` (recent scan history)

---

## 2. 📸 SCAN TAB (`app/(tabs)/scan.tsx`)

**Primary Purpose**: Medicine registration through camera/barcode scanning

### Key Features:
- **Multi-Mode Scanning**
  - OCR text scanning (medicine strips/boxes)
  - Barcode/QR code scanning
  - Batch scanning (multiple medicines)
  - Gallery image upload

- **Smart Recognition**
  - Auto-detect expiry dates
  - Medicine name extraction
  - Batch number recognition
  - Manufacturer identification

- **Post-Scan Actions**
  - Confirm/edit extracted data
  - Set custom reminders
  - Add storage location
  - Add personal notes

- **Scan History**
  - Failed scans for retry
  - Scan accuracy feedback
  - Recent successful scans

### Database Tables Used:
- `scans` (OCR results, images)
- `medicines` (create new entries)
- `reminders` (set notifications)
- `canonical_medicines` (medicine lookup)

---

## 3. 💊 MEDICINES TAB (`app/(tabs)/medicines.tsx`)

**Primary Purpose**: Complete medicine inventory management

### Key Features:
- **Medicine Inventory**
  - All active medicines list
  - Filter by expiry status (expired/expiring/fresh)
  - Sort by expiry date/name/type
  - Search functionality

- **Medicine Categories**
  - Prescription medicines
  - OTC medicines
  - Supplements
  - Herbal medicines

- **Inventory Management**
  - Update quantities
  - Mark as consumed/donated
  - Move to disposed
  - Share with family

- **Medicine Details**
  - Full medicine profile
  - Usage instructions
  - Storage requirements
  - Related reminders

### Database Tables Used:
- `medicines` (complete inventory)
- `reminders` (medicine-specific alerts)
- `medicine_donations` (sharing features)
- `canonical_medicines` (detailed info)

---

## 4. 🤖 ASSISTANT TAB (`app/(tabs)/assistant.tsx`)

**Primary Purpose**: AI-powered health assistance and report analysis

### Key Features:
- **Symptom Checker**
  - Describe symptoms → get AI suggestions
  - OTC medicine recommendations
  - Home remedy suggestions
  - When to see a doctor warnings

- **Report Analysis**
  - Upload lab reports (PDF/images)
  - AI summarization of results
  - Key findings extraction
  - Normal/abnormal value indicators

- **Medicine Information**
  - Drug interactions checker
  - Side effects information
  - Dosage recommendations
  - Alternative medicines

- **Chat History**
  - Persistent conversation threads
  - Report-specific chats
  - Bookmark important responses
  - Share chat with doctors

### Database Tables Used:
- `ai_chat_sessions` (chat threads)
- `chat_messages` (conversation history)
- `medical_reports` (uploaded reports)
- `medicines` (drug interaction checks)
- `canonical_medicines` (medicine database)

---

## 5. 🕐 HISTORY TAB (`app/(tabs)/history.tsx`)

**Primary Purpose**: Activity tracking, reminders, and past records

### Key Features:
- **Activity Timeline**
  - Scan history with images
  - Medicine additions/updates
  - Reminder notifications
  - AI chat sessions

- **Reminder Management**
  - Upcoming reminders
  - Reminder history
  - Snooze/acknowledge options
  - Reminder settings

- **Usage Analytics**
  - Medicine consumption tracking
  - Scanning frequency
  - Most scanned medicines
  - Cost tracking (optional)

- **Export & Backup**
  - Export medicine list
  - Backup scan data
  - Share with healthcare providers
  - Print medication list

### Database Tables Used:
- `user_activities` (all user actions)
- `reminders` (notification history)
- `scans` (scanning records)
- `medicines` (usage tracking)
- `chat_messages` (AI interaction history)

---

## 6. 👤 PROFILE TAB (`app/(tabs)/profile.tsx`)

**Primary Purpose**: User settings, health profile, and app preferences

### Key Features:
- **Health Profile**
  - Personal health information
  - Known allergies
  - Chronic conditions
  - Current medications
  - Emergency contacts

- **App Preferences**
  - Notification settings
  - Reminder preferences
  - Language settings
  - Date/time format
  - Privacy controls

- **Account Management**
  - Profile information
  - Data sharing preferences
  - Privacy settings
  - Account security

- **App Settings**
  - Theme preferences
  - Storage management
  - Data export
  - Feedback & support

### Database Tables Used:
- `users` (profile & preferences)
- `user_health_profiles` (health information)
- `user_feedback` (support requests)
- `user_activities` (usage analytics)

---

## Navigation Flow Examples:

### Critical Medicine Expiry Flow:
1. **Home Tab** → Shows "3 medicines expiring in 2 days" alert
2. **Medicines Tab** → Auto-filtered to show expiring medicines
3. **Individual Medicine** → Option to set new reminder or mark as replaced

### New Medicine Registration Flow:
1. **Scan Tab** → Camera captures medicine box
2. **Confirmation Screen** → Edit OCR results
3. **Medicine Details** → Add personal notes, set reminders
4. **Success** → Medicine added to inventory
5. **Home Tab** → Shows updated count

### Health Consultation Flow:
1. **Assistant Tab** → "I have a headache for 2 days"
2. **AI Response** → Suggests possible causes, OTC options
3. **Follow-up** → "Should I take ibuprofen?"
4. **Medicine Check** → AI checks user's medicine inventory
5. **Recommendation** → Personalized advice based on user's health profile

### Medicine Sharing Flow:
1. **Medicines Tab** → Select unused medicine
2. **Donation Option** → Create donation listing
3. **Community** → Other users can see and request
4. **History Tab** → Track donation status

---

