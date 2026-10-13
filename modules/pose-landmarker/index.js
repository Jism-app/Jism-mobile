// This module has no JS API of its own — it's a pure native frame
// processor plugin. The app's JS code accesses it directly via
// VisionCamera:
//
//   import { VisionCameraProxy } from 'react-native-vision-camera';
//   const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectPose', {});
//
// This file exists only so the package is a valid importable Node
// module (package.json's "main" points here) — nothing needs exporting.
module.exports = {};
