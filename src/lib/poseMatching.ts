import {
  FrameQualityMetrics,
  HINT_COPY,
  LANDMARK,
  PoseIssue,
  PoseIssueCode,
  PoseLandmarks,
  PoseMatchResult,
  ScanAngle,
} from './poseMatching.types';

// ============================================================
// Thresholds — ALL of these are reasonable starting points, not
// validated numbers. They were chosen by reasoning about normalized
// landmark coordinates, not by testing against a real camera feed
// (no physical device available yet — see Task #4 / PROJECT_CONTEXT).
// Expect to retune every constant in this block once Sprint 4 can
// actually run on a phone.
// ============================================================

const MIN_LANDMARK_VISIBILITY = 0.6; // per-point confidence floor
const MIN_KEY_LANDMARKS_VISIBLE = 0.8; // fraction of required points that must clear the floor

const CENTER_TOLERANCE_X = 0.12; // hip-midpoint x distance from 0.5 frame-center
const SHOULDER_LEVEL_TOLERANCE = 0.04; // normalized y difference between shoulders

// Body "footprint" in frame — hip-to-shoulder vertical span as a
// fraction of frame height, used as a cheap distance-from-camera proxy.
const BODY_SPAN_TOO_CLOSE = 0.75;
const BODY_SPAN_TOO_FAR = 0.25;

// Front/back: shoulder-width (x-distance) should be close to hip-width,
// both large relative to frame. Profile (left/right): shoulder width
// collapses because the body is foreshortened — ratio below this means
// "still mostly facing the camera, not a true profile".
const PROFILE_FORESHORTENING_RATIO = 0.45; // shoulder-x-width / hip-x-width upper bound for a valid profile

const QUALITY_MIN_BRIGHTNESS = 70;
const QUALITY_MAX_BRIGHTNESS = 200;
const QUALITY_MIN_BLUR_SCORE = 40; // below = blurry; unit depends on native implementation
const QUALITY_MAX_MOTION_DELTA = 0.015; // above = still moving; unit depends on native implementation

// Auto-capture: require this many consecutive good frames before
// firing, so a single lucky frame doesn't trigger a blurry capture.
export const AUTO_CAPTURE_CONSECUTIVE_FRAMES = 15; // ~0.5s at 30fps
export const READY_SCORE_THRESHOLD = 85;

function visible(landmarks: PoseLandmarks, index: number): boolean {
  return (landmarks[index]?.visibility ?? 0) >= MIN_LANDMARK_VISIBILITY;
}

function keyLandmarksVisible(landmarks: PoseLandmarks): boolean {
  const required = [
    LANDMARK.LEFT_SHOULDER,
    LANDMARK.RIGHT_SHOULDER,
    LANDMARK.LEFT_HIP,
    LANDMARK.RIGHT_HIP,
    LANDMARK.LEFT_KNEE,
    LANDMARK.RIGHT_KNEE,
    LANDMARK.LEFT_ANKLE,
    LANDMARK.RIGHT_ANKLE,
  ];
  const visibleCount = required.filter((i) => visible(landmarks, i)).length;
  return visibleCount / required.length >= MIN_KEY_LANDMARKS_VISIBLE;
}

/**
 * Scores how well the detected pose matches the standardized capture
 * pose for the given angle. Pure function — no camera/native dependency.
 */
export function scorePose(
  landmarks: PoseLandmarks | null,
  angle: ScanAngle,
): { score: number; issues: PoseIssue[] } {
  const issues: PoseIssue[] = [];

  if (!landmarks || landmarks.length === 0) {
    return { score: 0, issues: [{ code: 'no_person_detected', severity: 3 }] };
  }

  if (!keyLandmarksVisible(landmarks)) {
    issues.push({ code: 'low_visibility', severity: 3 });
    // Can't trust geometry on partially-visible landmarks — return early
    // rather than scoring noise.
    return { score: 0, issues };
  }

  const leftShoulder = landmarks[LANDMARK.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK.RIGHT_SHOULDER];
  const leftHip = landmarks[LANDMARK.LEFT_HIP];
  const rightHip = landmarks[LANDMARK.RIGHT_HIP];
  const leftAnkle = landmarks[LANDMARK.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARK.RIGHT_ANKLE];

  const hipMidX = (leftHip.x + rightHip.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const ankleMidY = (leftAnkle.y + rightAnkle.y) / 2;

  // --- Centering ---
  if (Math.abs(hipMidX - 0.5) > CENTER_TOLERANCE_X) {
    issues.push({ code: 'not_centered', severity: 2 });
  }

  // --- Distance from camera (body span as fraction of frame height) ---
  const bodySpan = Math.abs(ankleMidY - shoulderMidY);
  if (bodySpan > BODY_SPAN_TOO_CLOSE) {
    issues.push({ code: 'too_close', severity: 2 });
  } else if (bodySpan < BODY_SPAN_TOO_FAR) {
    issues.push({ code: 'too_far', severity: 2 });
  }

  // --- Shoulder level (posture / tilt) ---
  if (Math.abs(leftShoulder.y - rightShoulder.y) > SHOULDER_LEVEL_TOLERANCE) {
    issues.push({ code: 'shoulders_not_level', severity: 1 });
  }

  // --- Angle-specific geometry ---
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const hipWidth = Math.abs(leftHip.x - rightHip.x) || 0.0001; // guard div-by-zero
  const foreshorteningRatio = shoulderWidth / hipWidth;

  if (angle === 'front' || angle === 'back') {
    // Expect the body roughly "open" to the camera: shoulders should NOT
    // be meaningfully narrower than hips (that would indicate a turned torso).
    if (foreshorteningRatio < PROFILE_FORESHORTENING_RATIO) {
      issues.push({ code: 'not_facing_camera', severity: 2 });
    }
  } else {
    // left / right profile: shoulders should be visibly foreshortened
    // relative to hips — a high ratio means the user is still facing
    // the camera instead of turning to the side.
    if (foreshorteningRatio >= PROFILE_FORESHORTENING_RATIO) {
      issues.push({ code: 'wrong_profile_angle', severity: 2 });
    }
  }

  // --- Score: start at 100, subtract weighted penalties per issue ---
  const score = issues.reduce((acc, issue) => acc - issue.severity * 15, 100);

  return { score: Math.max(0, score), issues };
}

/**
 * Scores frame quality (blur / lighting / motion) independent of pose
 * geometry. These metrics come from the native frame-processor, not
 * computed here.
 */
export function scoreFrameQuality(metrics: FrameQualityMetrics): {
  score: number;
  issues: PoseIssue[];
} {
  const issues: PoseIssue[] = [];

  if (metrics.brightness < QUALITY_MIN_BRIGHTNESS) {
    issues.push({ code: 'too_dark', severity: 2 });
  } else if (metrics.brightness > QUALITY_MAX_BRIGHTNESS) {
    issues.push({ code: 'too_bright', severity: 1 });
  }

  if (metrics.blurScore < QUALITY_MIN_BLUR_SCORE) {
    issues.push({ code: 'blurry', severity: 2 });
  }

  if (metrics.motionDelta > QUALITY_MAX_MOTION_DELTA) {
    issues.push({ code: 'moving', severity: 1 });
  }

  const score = issues.reduce((acc, issue) => acc - issue.severity * 20, 100);
  return { score: Math.max(0, score), issues };
}

/**
 * Picks the single most important hint to show the user right now.
 * "Most important" = highest severity, with pose-geometry issues
 * (can't even detect/frame the person) prioritized over quality issues
 * (blur/lighting) at equal severity, since geometry issues usually have
 * to be fixed before quality matters.
 */
function pickPrimaryHint(poseIssues: PoseIssue[], qualityIssues: PoseIssue[]): PoseIssueCode | null {
  const all = [
    ...poseIssues.map((i) => ({ ...i, source: 'pose' as const })),
    ...qualityIssues.map((i) => ({ ...i, source: 'quality' as const })),
  ];
  if (all.length === 0) return null;

  all.sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    if (a.source !== b.source) return a.source === 'pose' ? -1 : 1;
    return 0;
  });

  return all[0].code;
}

/**
 * Full per-frame evaluation: combines pose geometry + frame quality into
 * one result, including the single hint to surface and whether this
 * frame alone clears the bar for capture (consecutive-frame debouncing
 * happens in AutoCaptureTracker below, not here).
 */
export function evaluateFrame(
  landmarks: PoseLandmarks | null,
  quality: FrameQualityMetrics,
  angle: ScanAngle,
): PoseMatchResult {
  const pose = scorePose(landmarks, angle);
  const qualityResult = scoreFrameQuality(quality);

  // Weighted blend — pose geometry matters more than raw image quality,
  // since a slightly dim-but-correctly-posed photo is still usable while
  // a sharp photo of the wrong pose is not.
  const overallScore = Math.round(pose.score * 0.7 + qualityResult.score * 0.3);

  const primaryIssueCode = pickPrimaryHint(pose.issues, qualityResult.issues);

  return {
    overallScore,
    poseScore: pose.score,
    qualityScore: qualityResult.score,
    issues: [...pose.issues, ...qualityResult.issues],
    primaryHint: primaryIssueCode ? HINT_COPY[primaryIssueCode] : null,
    readyForCapture: overallScore >= READY_SCORE_THRESHOLD,
  };
}

/**
 * Debounces single-frame "ready" signals into an actual auto-capture
 * trigger: requires AUTO_CAPTURE_CONSECUTIVE_FRAMES good frames in a row,
 * and a cooldown after firing so the same held pose doesn't fire twice.
 *
 * Stateful by design (consecutive-frame tracking can't be a pure
 * function) — instantiate one per capture screen, call `update()` once
 * per frame-processor callback.
 */
export class AutoCaptureTracker {
  private consecutiveGoodFrames = 0;
  private hasFiredForThisHold = false;

  /** Returns true exactly once per sustained good pose. */
  update(result: PoseMatchResult): boolean {
    if (result.readyForCapture) {
      this.consecutiveGoodFrames += 1;
    } else {
      this.consecutiveGoodFrames = 0;
      this.hasFiredForThisHold = false;
    }

    if (
      this.consecutiveGoodFrames >= AUTO_CAPTURE_CONSECUTIVE_FRAMES &&
      !this.hasFiredForThisHold
    ) {
      this.hasFiredForThisHold = true;
      return true;
    }
    return false;
  }

  reset(): void {
    this.consecutiveGoodFrames = 0;
    this.hasFiredForThisHold = false;
  }
}
