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

### set up env

- create ANDROID_HOME to your env variables, the value is "xxx\Android\Sdk"
- add %ANDROID_HOME%\platform-tools to your system's Path env variable.
- add %ANDROID_HOME%\emulator to your system's Path env variable.
- create JAVA_HOME to your env variables, the value is the path of your JDK 17

```shell
npm install -g yarn
npm install @react-native-firebase/app
npm install  @react-native-firebase/firestore @react-native-firebase/auth  @react-native-firebase/database @react-native-firebase/messaging
```

### run the app locally

```shell
git clone https://github.com/cs421sp25-homework/team-06.git
cd ./AndroidApp

yarn android
or
npx react-native run-android
```
This will compile the native part of the project while starting the Metro service in another command line to bundle the JavaScript code in real-time.

If you are confronted with some error, try the following:
```shell
cd ./android
chmod +x ./gradlew
./gradlew clean
cd ../
yarn android
```

### firebase support
I have added the firebase information file "google-services.json" into "AndroidApp/android/app/", so the app can directly connect to the Firebase.

## Deploy
you can simply deploy it on your android phone.

- Make sure your Android device is connected to your laptop via USB and that USB debugging is enabled on your Android phone.
- Start the React Native Metro bundler
```shell
npx react-native start
```
- Run the App
```shell
npx react-native run-android
```


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