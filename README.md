# OOSE Team Project

Name of the application goes here -- followed by a brief description (elevator pitch) of the application.

- [Team Information & Agreement](./docs/team-agreement.md)
- [Requirements Specification](./docs/requirements-specification.md)
- [Project Roadmap](./docs/roadmap.md)
- [Technical Documentation](./docs/technical-documentation.md)

## Installing / Getting started

### Pre-requisite

- node_js 22.14.0
- JDK 17
- Android Studio

### Setup env

- check details in [react native official document](https://reactnative.dev/docs/set-up-your-environment)
- create ANDROID_HOME to your env variables, the value is "xxx\Android\Sdk"
- add %ANDROID_HOME%\platform-tools to your system's Path env variable.
- add %ANDROID_HOME%\emulator to your system's Path env variable.
- create JAVA_HOME to your env variables, the value is the path of your JDK 17
- you can run this commend `npx react-native doctor` in the Android folder to check whether you set up environment correctly.
- you may need to install the lastest command-line tool in Android Studio and add this to your system's Path env `export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin`

```shell
## For yarn start
npm install -g yarn
npm install @react-native-firebase/app
npm install  @react-native-firebase/firestore @react-native-firebase/auth  @react-native-firebase/database @react-native-firebase/messaging
```

### Run the app locally

Now, we can use Expo to run the app.

```shell
git clone https://github.com/cs421sp25-homework/team-06.git
cd ./sync-trip
npx expo install
npx expo prebuild --platform android --clean
npx expo run:android
```

### Build the app with EAS to get a release

```shell
npm install -g eas-cli
eas build --profile development --platform android
```

This will build a apk for any devices to install.

For iteration 2, we have released our app on expo. You can simply download the apk from: https://expo.dev/accounts/s370101387/projects/sync-trip/builds/7953db98-7477-4ed1-9ac3-ecfeb68a1ae3

### Build a development version quickly

```shell
npx expo start
```

This will allow you quickly run the app when developing.

### Firebase support

I have added the firebase information file "google-services.json" into "AndroidApp/android/app/", so the app can directly connect to the Firebase.

## E2E Test

Since we are using expo now, we decided to use Maestro to do E2E test. We setup the flow as shown in
[maestro-test.yaml](./sync-trip/.eas/build/maestro-test.yaml).

```shell
npm install -g eas-cli
brew install maestro
export PATH="$PATH":"$HOME/.maestro/bin"
eas init
eas build:configure
eas build --profile maestro-test
```

Or we can test the app locally by running [afterLoginTest.yaml](./sync-trip/maestro/afterLoginTest.yaml).

```shell
brew install maestro
export PATH="$PATH":"$HOME/.maestro/bin"
npm install -g eas-cli
eas init
eas build:configure --platform android
npx expo run:android
maestro test ./maestro/afterLoginTest.yaml
```

After running commands above, we can check out the result on Expo portal.

## Automated Test

For automated test, we run the workflow in Github Actions. In the yaml file, we run the E2E test
on Expo portal, and the test is configured in [automated_test.yml](.github/workflows/automated_test.yml)

To trigger the Automated Test, we run the yaml file when create the pull request, so we can merge
branched in to the main branch with more confidence.

## Deploy

you can simply deploy it on your android phone.

Scan the QR code or enter the URL after building with Expo.

## Completed Feature in Iteration 1

1. User can sign up with their email and password, or directly sign in with their google accounts.
2. User can log in, log out and delete their account.
3. User can use verification email to change password and verify identity.
4. User can edit and show their profile and information
5. User can navigate between different screens by the bottom navigator.

## Completed Feature in Iteration 2

1. User can create a new Trip with a title and a date range in "+" screen.
2. User can edit the title and date range and the trip status (planning, ongoing, completed) in trip screen.
3. User can see all the trips in dashboard screen, and invite others to a trip by input email.
4. User can select any of the trips to be the current trip to edit or see.
5. User can see the map and long press the map to add a destination to the current trip, it will show on the map as a marker and show on current trip screen as a destination item.
6. User can press the marker to see and edit the description of the destination on the map.
7. User can assign date for any destination on the current trip screen.
8. User can delete a destination on the current trip screen.
9. Differnet Users can edit the trip and destinations together **in real-time**, they can see the updated changes with no latency.

## Completed Features in Iteration 3

1. Notices Board
Group members can post and view announcements in a shared “Notices” screen, with real‑time Firestore syncing and author‑based permissions.
2. Itinerary Update Notifications
Integrated Firebase Cloud Messaging and Cloud Functions so that any change to the trip itinerary triggers a push notification to all participants.
3. Calendar Sync / .ics Export
Users can export their trip itinerary as an iCalendar (.ics) file via a Cloud Function, then download/import it into external calendar apps.
4. Trip History & Archiving
Added a status field (active/archived) to trip documents and a UI toggle, enabling users to archive or delete past trips and filter between active vs. archived.
5. Search & Mark Points of Interest
Connected Google Places API to let users search for restaurants, attractions, hotels, or gas stations and place persistent markers on the map.
6. Visual Collaboration Indicators
Map markers now display distinct colors or user avatars indicating who added each location, improving multi‑user transparency.
7. Daily Weather + Itinerary Summaries
Scheduled Cloud Functions fetch weather forecasts and itinerary details each morning, then send daily push notifications; a dedicated “Daily Summary” screen allows manual review.
8. Detailed Destination Information
Tapping a marker opens a detail view populated via Places API (key attractions, local tips, hours), so users get rich destination info without relying on user reviews.

## Completed Features in Iteration 4

1. Shared Expense Creation & Splitting
Users can create expenses in the trip, assign amounts to members, and split bills automatically, with data stored in Firestore.
2. Activity‑Level & Total Cost Views
An Expense screen summarizes per‑activity costs and aggregates total trip spending, updated in real time.
3. Final Payment Summary
At trip end, the app generates a “Who Owes Whom” view showing each member’s net balance and suggested settlements.
4. Historical Cost & Itinerary Review
Archived trips include a detailed cost history alongside the original itinerary, allowing users to revisit past plans and expenses.
5. Itinerary Archiving
Past itineraries are moved out of the active dashboard into an “Archived Trips” section, keeping the main view uncluttered.
6. Real‑Time Google Maps Interaction
Enhanced map component integrates live traffic data and route adjustments, so users can plan on the fly based on current conditions.
7. Expense Update Notifications
Firebase Cloud Functions now also trigger push notifications when shared expenses are added or modified, keeping everyone in sync.

___

## Tech Stacks

1. **Framework: React Native (with React Native CLI)**
    - Although our current focus is on Android, React Native’s cross-platform nature allows us to eventually
      expand to iOS with minimal code changes.
    - With a vast ecosystem and strong community support, we have access to numerous libraries, tools,
      and community-driven best practices that accelerate development.
    - React Native provides near-native performance by utilizing native components, ensuring a smooth and responsive user experience.
2. **UI Library: Native React Native Components**
    - Utilizing native components ensures that the app behaves as expected on Android devices, providing a familiar look and feel to users.
    - Native components give us the control to style and adapt the UI specifically for our application’s unique design requirements.
3. **Backend & Database: Firebase Firestore (for real-time updates & data storage)**
    - Firestore is designed for real-time data synchronization, which is crucial for a trip planner app that might display
      dynamic information like itineraries, travel updates, or user activity.
    - Firebase integrates well with mobile apps and scales automatically, allowing us to focus on feature development rather than infrastructure concerns.
    - It’s a managed NoSQL cloud database, which reduces the overhead of server management and maintenance.


<!-- ## Developing

Detailed and step-by-step documentation for setting up local development. For example, a new team member will use these instructions to start developing the project further. 

```shell
commands here
```

You should include what is needed (e.g. all of the configurations) to set up the dev environment. For instance, global dependencies or any other tools (include download links), explaining what database (and version) has been used, etc. If there is any virtual environment, local server, ..., explain here. 

Additionally, describe and show how to run the tests, explain your code style and show how to check it.

If your project needs some additional steps for the developer to build the project after some code changes, state them here. Moreover, give instructions on how to build and release a new version. In case there's some step you have to take that publishes this project to a server, it must be stated here.  -->

## Contributing

Refer to the [Contributing Guidelines](./CONTRIBUTING.md) for information on how to contribute to the project.

## Licensing

Refer to the [Project Repository License](./LICENSE.md) for information on how the project is licensed.
