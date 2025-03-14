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
npx expo prebuild --clean
npx expo run:android
```


### Build the app with EAS to get a release
```shell
npm install -g eas-cli
eas build --profile development --platform android
```
This will build a apk for any devices to install.

### Build a development version quickly
```shell
npx expo start
```
This will allow you quickly run the app when developing.

### Firebase support

I have added the firebase information file "google-services.json" into "AndroidApp/android/app/", so the app can directly connect to the Firebase.

### E2E Test

Since we are using expo now, we decided to use Maestro to do E2E test. We setup the flow as shown in
[maestro-test.yaml](./maestro/maestro-test.yaml).

```shell
npm install -g eas-cli
brew install maestro
export PATH="$PATH":"$HOME/.maestro/bin"
eas init
eas build:configure
eas build --profile maestro-test
```
Or we can test the app locally
```shell
brew install maestro
export PATH="$PATH":"$HOME/.maestro/bin"
npm install -g eas-cli
eas init
eas build:configure --platform android
npx expo run:android
maestro test ./maestro/dashboardScreen_test.yaml
```
After running commands above, we can check out the result on Expo portal.

## Deploy

you can simply deploy it on your android phone.

Scan the QR code or enter the URL after building with Expo.

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

## Completed Feature
1. User can sign up with their email and password, or directly sign in with their google accounts.
2. User can log in, log out and delete their account.
2. User can use verification email to change password and verify identity.
3. User can edit and show their profile and information
4. User can navigate between different screens by the bottom navigator.

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
