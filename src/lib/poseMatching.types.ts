// Shared types for the Pose-Matching Engine (Layer 2).
//
// PoseLandmarks is whatever the native frame-processor plugin (Task #4,
// not yet testable without a physical device) hands back per frame —
// the MediaPipe Pose Landmarker's 33-point BlazePose output, normalized
// image coordinates (x, y in [0,1], z relative depth, visibility in [0,1]).
//
// This file has ZERO dependency on the native module or on
// react-native-vision-camera on purpose: the scoring math is pure and
// unit-testable against mock landmark arrays, same approach as the
// Nutrition Engine in Sprint 3.

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

// Index order matches MediaPipe's BlazePose 33-point model.
export const LANDMARK = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

export type PoseLandmarks = PoseLandmark[]; // length 33, indexed by LANDMARK.*

export type ScanAngle = 'front' | 'left' | 'right' | 'back';

// Per-frame signal the native layer computes from the camera buffer
// itself (not from landmarks) — blur via a Laplacian-variance style
// sharpness metric, brightness as mean luma, motion as frame-to-frame
// pixel delta. The frame-processor plugin (Task #4) is responsible for
// producing these; this engine only consumes them.
export interface FrameQualityMetrics {
  brightness: number; // 0-255, target ~90-180 for even indoor lighting
  blurScore: number; // higher = sharper; threshold calibrated on-device
  motionDelta: number; // 0 = perfectly still, calibrated on-device
}

export type PoseIssueCode =
  | 'no_person_detected'
  | 'low_visibility'
  | 'not_centered'
  | 'too_close'
  | 'too_far'
  | 'not_facing_camera'
  | 'shoulders_not_level'
  | 'wrong_profile_angle'
  | 'too_dark'
  | 'too_bright'
  | 'blurry'
  | 'moving';

export interface PoseIssue {
  code: PoseIssueCode;
  severity: number; // 1 (minor) - 3 (blocking) — drives hint priority
}

// One sentence of user-facing guidance per issue. Kept separate from
// scoring so copy can be localized (Arabic first) without touching math.
export const HINT_COPY: Record<PoseIssueCode, string> = {
  no_person_detected: 'Step into frame so your whole body is visible',
  low_visibility: 'Make sure your whole body is visible in the frame',
  not_centered: 'Move to the center of the frame',
  too_close: 'Step back from the camera',
  too_far: 'Step closer to the camera',
  not_facing_camera: 'Face the camera directly',
  shoulders_not_level: 'Stand up straight, keep shoulders level',
  wrong_profile_angle: 'Turn to show your full side profile',
  too_dark: 'Move to a brighter area',
  too_bright: 'Reduce direct light or glare on the camera',
  blurry: 'Hold still — image is blurry',
  moving: 'Hold still',
};

export interface PoseMatchResult {
  overallScore: number; // 0-100, weighted blend of pose + quality
  poseScore: number; // 0-100, landmark-geometry match for the target angle
  qualityScore: number; // 0-100, blur/lighting/motion
  issues: PoseIssue[]; // all detected issues, most severe first
  primaryHint: string | null; // HINT_COPY for the single highest-priority issue
  readyForCapture: boolean; // true only when score + quality clear thresholds
}
