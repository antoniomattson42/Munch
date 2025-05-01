# Munch
yummy

### Firebase Setup:
Home > Settings Icon > Project Settings, scroll to your apps. Download `google-services.json` and `GoogleService-Info.plist` from the Android and Apple apps section. put them in the root folder.

## How to Run:
### Android
#### Prerequisites:
- Java JDK 17
- Android Studio

This project has only been tested on an android emulator. Expo Go does not work due to Firebase requiring native builds.
Have your android emulator open, then run the following:

```
npx expo prebuild
npx expo run:android
```

### iOS

If you want to test for iOS, you must have a mac and an iOS emulator (Xcode) active. Run the following:

```
npx expo prebuild
npx expo run:ios
```