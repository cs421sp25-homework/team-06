# Technical Documentation

## Introduction

### 1.1 Purpose  
Sync-Trip is a mobile application designed to enable groups to collaboratively plan and manage trip itineraries in real time on Android and iOS platforms. It offers tools for creating trips, scheduling destinations, viewing interactive maps, and sending notifications to keep all participants up to date.

### 1.2 Scope  
This document covers the following Sync-Trip features:

- Trip creation, editing, and deletion
- Destination scheduling (date, time, location)
- Real-time synchronization across devices via Firebase Firestore
- Interactive map integration for adding and viewing destinations
- Push notifications for trip updates (background only)
- Offline support using Firestore’s local cache
- Billing permission management 

### 1.3 Audience  
This documentation is intended for:

- **Mobile Developers:** For feature enhancements and maintenance
- **QA/Testing Engineers:** For writing and executing automated tests
- **DevOps/Release Engineers:** For build and deployment processes
- **Product Managers:** For understanding system capabilities and limitations

## System Overview

### 2.1 Architecture  
Sync-Trip uses a client-centric architecture with the following components:

1. **Frontend (React Native + Expo):**  
   - Developed with Expo SDK 48+ for Android and iOS support.  
   - UI built with React Native Paper (v5+) for consistent design.  
   - Navigation handled by React Navigation (v6+).  
   - State management via React Context for local trip data.

2. **Backend & Database (Firebase):**  
   - **Firestore:** Stores `users`, `trips`, and `destinations` collections with real-time listeners.  
   - **Storage:** Hosts images, user avatars, and ICS export files.  
   - **Authentication:** Manages user login via Firebase Auth (email/password and Google OAuth).

3. **Notifications (Expo):**  
   - Utilizes Expo Push Notification service for background alerts.  
   - Device tokens saved under `users/{uid}/expoTokens` in Firestore.

4. **Testing (Maestro + CI):**  
   - End-to-end tests defined with Maestro YAML scripts.  
   - Automated test suite run on GitHub Actions for pull request validation.

### 2.2 Technologies Used  
- React Native (Expo SDK 48+)  
- React Native Paper (v5+)  
- React Navigation (v6+)  
- Firebase Firestore & Storage (v9 modular)  
- Firebase Auth (v9 modular)  
- Expo Push Notifications  
- Maestro for E2E testing  
- GitHub Actions for CI

### 2.3 Dependencies  
- Node.js ≥ v18.0.0  
- npm ≥ v8.0.0  
- Expo CLI ≥ v5.0.0  
- Android SDK (API Level 21+)  

## Installation Guide

### 3.1 Prerequisites  
- **Node.js** v22.14.0 or higher  
- **Yarn** ≥ v1.22.0 (or npm ≥ v8.0.0)  
- **JDK** 17  
- **Android Studio** with SDK & command-line tools  
- **Expo CLI:** Install with `npm install -g expo-cli`  
- **Firebase CLI (optional):** Install with `npm install -g firebase-tools`

### 3.2 System Requirements  
- **Hardware:** Minimum 8 GB RAM, modern multi-core CPU  
- **Operating System:** macOS, Windows, or Linux  
- **Mobile Emulators:** Android Studio or Xcode Simulator

### 3.3 Installation Steps  
1. Clone the repository:  
   ```bash
   git clone https://github.com/cs421sp25-homework/team-06.git
   cd sync-trip
   ```  
2. Install dependencies:  
   ```bash
   yarn install
   npx expo install
   ```  
3. Copy and configure environment variables:  
   ```bash
   cp .env.example .env
   # Edit .env with Firebase and Google Maps keys
   ```  
4. Prebuild native code (Android):  
   ```bash
   npx expo prebuild --platform android --clean
   ```  
5. Launch on emulator or device:  
   ```bash
   npx expo run:android
   ```  
6. Start development server:  
   ```bash
   npx expo start
   ```  
7. Build a development APK (EAS):  
   ```bash
   eas build --profile development --platform android
   ```

## Configuration Guide

### 4.1 Configuration Parameters  
Store the following in the `.env` file:

| Variable                    | Description                                      |
|-----------------------------|--------------------------------------------------|
| `FIREBASE_API_KEY`          | Firebase project API key                         |
| `FIREBASE_AUTH_DOMAIN`      | Firebase Auth domain                             |
| `FIREBASE_PROJECT_ID`       | Firebase project ID                              |
| `FIREBASE_STORAGE_BUCKET`   | Firebase Storage bucket                          |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID                |
| `FIREBASE_APP_ID`           | Firebase App ID                                  |
| `GOOGLE_MAPS_API_KEY`       | API key for Google Maps SDK                      |
| `ANDROID_HOME`              | Path to local Android SDK                        |
| `JAVA_HOME`                 | Path to installed JDK 17                         |

### 4.2 Environment Setup  
1. Export environment variables:  
   ```bash
   export ANDROID_HOME="<path-to-Android-Sdk>"
   export JAVA_HOME="<path-to-JDK-17>"
   export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
   ```  
2. Verify setup:  
   ```bash
   npx react-native doctor
   ```  
3. Firebase configuration:  
   - Place `google-services.json` in `android/app/`.  
   - Ensure Firestore, Auth, and Storage are enabled in Firebase Console.

### 4.3 External Services Integration  
- **Firestore Emulators:** Configure in `firebase.json`, run `firebase emulators:start`.  
- **Expo Push Notifications:** Register tokens with `NotificationHandler.registerForPushNotificationsAsync()`, then save to Firestore.  
- **Cloud Functions:** (Planned) For server-side triggers on billing changes.

## Usage Guide

### 5.1 User Interface Overview  
- **Login / Signup:** User authentication screens  
- **Home / Dashboard:** Active and archived trips list  
- **New Trip:** Form for title, dates, and member invites  
- **Current Trip:**  
  - **Map Tab:** Add/view destination markers  
  - **Destinations:** Edit or delete scheduled stops  
  - **Checklist & Announcements:** Collaboration tools  
  - **Billing:** Expense entry and split summary  
- **Profile:** Manage user information and logout

### 5.2 User Authentication  
- Supports **Email/Password** and **Google OAuth** via Firebase Auth.  
- Session management and token refresh handled by Firebase SDK.

### 5.3 Core Functionality  
- **Trips CRUD:** Create, read, update, delete trips.  
- **Destinations Management:** Add via map or list, edit/delete through modals.  
- **Real-Time Sync:** Data writes via React Context trigger Firestore updates; `onSnapshot` listeners refresh UI immediately.

### 5.4 Advanced Features  
- **Offline Support:** Firestore caches writes locally and syncs upon reconnection.  
- **Push Notifications:** Background alerts for trip changes via Expo Notification service.  
- **Expense Tracking:** Create bills and transactions with automatic splitting.  
- **Calendar Export:** Generate `.ics` files stored in Firebase Storage.

### 5.5 Troubleshooting  
- **ICS Export Error:** "end[3] must be ≤ 23" — Ensure event end-hour is within 0–23.  
- **Map Load Failures:** Verify `GOOGLE_MAPS_API_KEY` restrictions and GCP billing.  
- **Missing Push Token:** Confirm `NotificationHandler` runs on login and writes to Firestore.  
- **Billing Edits:** No permission controls; plan to add security rules.

## API Documentation

### 6.1 Endpoints  
All interactions use Firestore collections; there are no custom REST endpoints.

- `users/{uid}`
- `trips/{tripId}`
- `trips/{tripId}/destinations/{destinationId}`

### 6.2 Request and Response Formats  
**Trip Document Example:**  
```json
{
  "title": "Beach Trip",
  "ownerUid": "user123",
  "createdAt": {"_seconds": 1610000000, "_nanoseconds": 0},
  "memberUids": ["user123","user456"]
}
```
**Destination Document Example:**  
```json
{
  "date": "2025-05-10T09:00:00.000Z",
  "location": "Central Park",
  "notes": "Bring snacks"
}
```

### 6.3 Authentication and Authorization  
- **Security Rules:** Only authenticated users in `memberUids` can read/write trip data.  
- **Future Rules:** Enforce creator-only edits on billing subcollections.

## Database Schema

### 7.1 Entity-Relationship Diagram  
The data model consists of three main entities with one-to-many relationships:

- **User** (1) → **Trip** (many): Each user can create or join multiple trips, referenced by `memberUids` in the Trip document.  
- **Trip** (1) → **Destination** (many): Each trip contains multiple destinations, stored in the `destinations` subcollection under a trip.  
- **User** (1) → **ExpoToken** (many): Users may have multiple device tokens, saved in the `expoTokens` array.

These relationships ensure that trip data and destination schedules are scoped under the appropriate user and trip contexts.

### 7.2 Table Definitions  
**users:**  `{ uid (PK), displayName, email, expoTokens[] }`  
**trips:**  `{ tripId (PK), ownerUid (FK), title, createdAt, memberUids[] }`  
**destinations:**  `{ destinationId (PK), tripId (FK), date, location, notes }`

### 7.3 Relationships and Constraints  
- **users → trips:** One-to-many via `memberUids`.  
- **trips → destinations:** One-to-many via `tripId`.  
- Firestore security rules enforce membership-based access control.

## Testing

### 8.1 Test Plan  
End-to-end testing using Maestro to cover:

- User authentication workflows  
- Trip and destination CRUD operations  
- Offline sync and conflict resolution  
- Expense tracking and notification triggers

### 8.2 Test Cases  
Defined in YAML files under `./maestro/`, including:

- `entireTest.yaml`: Full app flow
- `resetPwd.yaml`: Password reset and verification
- `signUpScreen_test.yaml`: Signup UI
- `profileTest.yaml`: Profile editing
- `tripCreation.yaml`: Trip creation steps
- `billTest.yaml`: Billing functionality
- `routeTest.yaml`: Map route interactions

### 8.3 Test Results  
CI badge shows ~95% pass rate. Failures primarily due to intermittent network conditions in emulator.

## Deployment

### 9.1 Deployment Process  
Production builds and submission via EAS:
```bash
eas build --profile production --platform all
eas submit --platform ios
eas submit --platform android
```  
Monitor build status in Expo dashboard and app store consoles.

### 9.2 Release Notes  
- **v1.0.0:** Initial release with core real-time syncing.  
- **v1.1.0:** Background notifications and offline support.  
- **v2.0.0:** Expense tracking and calendar export.

### 9.3 Known Issues and Limitations  
- **In-App Notifications:** Expo supports background only; no in-app banners.  
- **Billing Permissions:** No role-based controls; any member can edit.

## Glossary

### 10.1 Terms and Definitions  
- **Trip:** Collection of destinations shared among users.  
- **Destination:** Scheduled stop with date, time, and location.  
- **React Context:** API for passing state through the component tree.  
- **Firestore Subscription:** Real-time data listener for Firestore documents.  
- **Maestro:** End-to-end testing framework for Expo applications.

