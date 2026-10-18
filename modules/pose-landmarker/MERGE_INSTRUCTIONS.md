# pose-landmarker native module — merge instructions

This is a **local React Native library module**, not an Expo Module. It
lives outside the gitignored `android/` folder specifically so it
survives `expo prebuild` regeneration. You never hand-edit anything in
`android/` for this — autolinking does it for you at build time.

Status: **IMPLEMENTED**. The Android module registers `detectPose`, converts
VisionCamera YUV frames to MediaPipe images, and returns the first detected
33-point pose. It still needs validation on a physical Android device with a
working camera feed.

## 1. Copy the module folder

Copy the whole `pose-landmarker/` folder into your project at:

```
mobile/modules/pose-landmarker/
```

So you end up with `mobile/modules/pose-landmarker/package.json`,
`mobile/modules/pose-landmarker/android/...`, etc.

## 2. Add it as a dependency

In `mobile/package.json`, add to `"dependencies"`:

```json
"physiqueai-pose-landmarker": "file:./modules/pose-landmarker"
```

Then from `mobile/`:

```
npm install
```

This is what makes autolinking pick up `react-native.config.js` and wire
in `PoseLandmarkerPackage`.

## 3. Download the model file

MediaPipe ships the Pose Landmarker model as a `.task` file — it's a
binary, not something to generate. Official Google-hosted download
("lite" variant — fastest, chosen for mid/low-range phone performance;
you can swap in "full" or "heavy" later for more accuracy at the cost of
speed):

```
https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
```

Download it and place it at exactly (the file is intentionally ignored by git):

```
mobile/modules/pose-landmarker/android/src/main/assets/pose_landmarker_lite.task
```

(You'll need to create the `assets/` folder — it doesn't exist yet.) The
filename must match `MODEL_ASSET_PATH` in
`PoseLandmarkerFrameProcessorPlugin.kt` exactly.

This file is a few MB — don't commit it to git if you're keeping the repo
lean; add `**/assets/pose_landmarker_lite.task` to `.gitignore` and
instead document the download step (this file) for anyone else setting
up the project.

## 4. Bump minSdkVersion to 24

MediaPipe Tasks Vision requires API 24+. Your project's current
`minSdkVersion` is almost certainly lower (Expo's default is 23 or 21
depending on SDK version). Add the `expo-build-properties` plugin to
`mobile/app.json`:

```
npx expo install expo-build-properties
```

Then in `app.json`, add to the `"plugins"` array:

```json
[
  "expo-build-properties",
  {
    "android": {
      "minSdkVersion": 24
    }
  }
]
```

## 5. Add the worklets-core Babel plugin

VisionCamera's Frame Processors require `react-native-worklets-core`.
Confirm it's installed:

```
npx expo install react-native-worklets-core
```

Then open `mobile/babel.config.js` and add
`"react-native-worklets-core/plugin"` to the `plugins` array (create the
array if it doesn't exist). Paste me the current file if you want me to
merge it for you rather than doing it by hand.

## 6. Rebuild

```
npx expo prebuild --platform android --clean
npx expo run:android
```

`--clean` matters here since this is the first build picking up a brand
new native module — a stale prebuild cache could silently skip
autolinking it.

## 7. Using it from JS

Once it builds, the plugin is called from JS like this (this wiring
— the actual camera screen — is the next task, not included here):

```ts
import { VisionCameraProxy } from 'react-native-vision-camera';

const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectPose', {});

// inside a useFrameProcessor:
const landmarks = plugin.call(frame); // -> PoseLandmarks (33 points) or null
```

The returned shape matches `PoseLandmarks` in
`mobile/src/lib/poseMatching.types.ts` exactly, so it should plug
straight into the existing `poseMatching.ts` / `AutoCaptureTracker`
logic without any adapter code.

## If the build fails

Most likely failure modes, in order of likelihood:
1. **minSdkVersion mismatch** — if you skip step 4, expect a manifest
   merge error naming `com.physiqueai.poselandmarker` and API 24.
2. **Missing model asset** — if you skip step 3, the app will build fine
   but crash at runtime the first time the frame processor runs
   (`PoseLandmarker.createFromOptions` throws when the asset isn't
   found).
3. **VisionCamera version mismatch** — this module was written against
   `react-native-vision-camera@4.6.4`'s Kotlin Frame Processor API
   (`com.mrousavy.camera.frameprocessors.*`). If you ever upgrade
   vision-camera, this plugin's imports may need updating to match.

Paste me any build error you hit and I'll fix it — same as every other
step in this sprint.
