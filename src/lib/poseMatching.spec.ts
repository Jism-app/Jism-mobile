import { LANDMARK, PoseLandmark, PoseLandmarks } from './poseMatching.types';
import {
  AUTO_CAPTURE_CONSECUTIVE_FRAMES,
  AutoCaptureTracker,
  evaluateFrame,
  scoreFrameQuality,
  scorePose,
} from './poseMatching';

// Builds a 33-point landmark array with sensible defaults, so each test
// only needs to override the points it cares about.
function makeLandmarks(overrides: Partial<Record<number, Partial<PoseLandmark>>> = {}): PoseLandmarks {
  const base: PoseLandmark = { x: 0.5, y: 0.5, z: 0, visibility: 0.9 };
  const landmarks: PoseLandmarks = Array.from({ length: 33 }, () => ({ ...base }));
  for (const [index, override] of Object.entries(overrides)) {
    landmarks[Number(index)] = { ...landmarks[Number(index)], ...override };
  }
  return landmarks;
}

// A well-centered, correctly-posed standing front shot.
const GOOD_FRONT_POSE = makeLandmarks({
  [LANDMARK.LEFT_SHOULDER]: { x: 0.35, y: 0.3 },
  [LANDMARK.RIGHT_SHOULDER]: { x: 0.65, y: 0.3 },
  [LANDMARK.LEFT_HIP]: { x: 0.375, y: 0.55 },
  [LANDMARK.RIGHT_HIP]: { x: 0.625, y: 0.55 },
  [LANDMARK.LEFT_KNEE]: { x: 0.4, y: 0.75 },
  [LANDMARK.RIGHT_KNEE]: { x: 0.6, y: 0.75 },
  [LANDMARK.LEFT_ANKLE]: { x: 0.42, y: 0.9 },
  [LANDMARK.RIGHT_ANKLE]: { x: 0.58, y: 0.9 },
});

// Same body, turned to a true left-profile: shoulders collapse in x,
// well below the hip width.
const GOOD_LEFT_PROFILE = makeLandmarks({
  [LANDMARK.LEFT_SHOULDER]: { x: 0.52, y: 0.3 },
  [LANDMARK.RIGHT_SHOULDER]: { x: 0.48, y: 0.3 },
  [LANDMARK.LEFT_HIP]: { x: 0.56, y: 0.55 },
  [LANDMARK.RIGHT_HIP]: { x: 0.44, y: 0.55 },
  [LANDMARK.LEFT_KNEE]: { x: 0.55, y: 0.75 },
  [LANDMARK.RIGHT_KNEE]: { x: 0.45, y: 0.75 },
  [LANDMARK.LEFT_ANKLE]: { x: 0.54, y: 0.9 },
  [LANDMARK.RIGHT_ANKLE]: { x: 0.46, y: 0.9 },
});

describe('scorePose', () => {
  it('returns a near-perfect score for a correctly centered front pose', () => {
    const { score, issues } = scorePose(GOOD_FRONT_POSE, 'front');
    expect(issues).toHaveLength(0);
    expect(score).toBe(100);
  });

  it('returns 0 with no_person_detected when landmarks are null', () => {
    const { score, issues } = scorePose(null, 'front');
    expect(score).toBe(0);
    expect(issues).toEqual([{ code: 'no_person_detected', severity: 3 }]);
  });

  it('flags low_visibility and scores 0 when key landmarks are not visible', () => {
    const lowVis = makeLandmarks({
      [LANDMARK.LEFT_SHOULDER]: { visibility: 0.1 },
      [LANDMARK.RIGHT_SHOULDER]: { visibility: 0.1 },
      [LANDMARK.LEFT_HIP]: { visibility: 0.1 },
      [LANDMARK.RIGHT_HIP]: { visibility: 0.1 },
    });
    const { score, issues } = scorePose(lowVis, 'front');
    expect(score).toBe(0);
    expect(issues.map((i) => i.code)).toContain('low_visibility');
  });

  it('flags not_centered when hips are off to one side', () => {
    const shifted = makeLandmarks({
      [LANDMARK.LEFT_SHOULDER]: { x: 0.1, y: 0.3 },
      [LANDMARK.RIGHT_SHOULDER]: { x: 0.4, y: 0.3 },
      [LANDMARK.LEFT_HIP]: { x: 0.12, y: 0.55 },
      [LANDMARK.RIGHT_HIP]: { x: 0.38, y: 0.55 },
      [LANDMARK.LEFT_KNEE]: { x: 0.15, y: 0.75 },
      [LANDMARK.RIGHT_KNEE]: { x: 0.35, y: 0.75 },
      [LANDMARK.LEFT_ANKLE]: { x: 0.17, y: 0.9 },
      [LANDMARK.RIGHT_ANKLE]: { x: 0.33, y: 0.9 },
    });
    const { issues } = scorePose(shifted, 'front');
    expect(issues.map((i) => i.code)).toContain('not_centered');
  });

  it('flags not_facing_camera on a front angle when shoulders are turned away', () => {
    // Shoulder width collapsed like a profile, but requested angle is 'front'.
    const { issues } = scorePose(GOOD_LEFT_PROFILE, 'front');
    expect(issues.map((i) => i.code)).toContain('not_facing_camera');
  });

  it('accepts a correctly turned profile for the left angle', () => {
    const { score, issues } = scorePose(GOOD_LEFT_PROFILE, 'left');
    expect(issues.find((i) => i.code === 'wrong_profile_angle')).toBeUndefined();
    expect(score).toBe(100);
  });

  it('flags wrong_profile_angle when still facing the camera on a profile angle', () => {
    const { issues } = scorePose(GOOD_FRONT_POSE, 'left');
    expect(issues.map((i) => i.code)).toContain('wrong_profile_angle');
  });

  it('flags shoulders_not_level on a tilted posture', () => {
    const tilted = makeLandmarks({
      [LANDMARK.LEFT_SHOULDER]: { x: 0.35, y: 0.25 },
      [LANDMARK.RIGHT_SHOULDER]: { x: 0.65, y: 0.35 },
      [LANDMARK.LEFT_HIP]: { x: 0.375, y: 0.55 },
      [LANDMARK.RIGHT_HIP]: { x: 0.625, y: 0.55 },
      [LANDMARK.LEFT_KNEE]: { x: 0.4, y: 0.75 },
      [LANDMARK.RIGHT_KNEE]: { x: 0.6, y: 0.75 },
      [LANDMARK.LEFT_ANKLE]: { x: 0.42, y: 0.9 },
      [LANDMARK.RIGHT_ANKLE]: { x: 0.58, y: 0.9 },
    });
    const { issues } = scorePose(tilted, 'front');
    expect(issues.map((i) => i.code)).toContain('shoulders_not_level');
  });
});

describe('scoreFrameQuality', () => {
  it('scores 100 for well-lit, sharp, still frames', () => {
    const { score, issues } = scoreFrameQuality({
      brightness: 130,
      blurScore: 80,
      motionDelta: 0.002,
    });
    expect(score).toBe(100);
    expect(issues).toHaveLength(0);
  });

  it('flags too_dark below the brightness floor', () => {
    const { issues } = scoreFrameQuality({ brightness: 30, blurScore: 80, motionDelta: 0 });
    expect(issues.map((i) => i.code)).toContain('too_dark');
  });

  it('flags blurry below the sharpness floor', () => {
    const { issues } = scoreFrameQuality({ brightness: 130, blurScore: 10, motionDelta: 0 });
    expect(issues.map((i) => i.code)).toContain('blurry');
  });

  it('flags moving above the motion ceiling', () => {
    const { issues } = scoreFrameQuality({ brightness: 130, blurScore: 80, motionDelta: 0.05 });
    expect(issues.map((i) => i.code)).toContain('moving');
  });
});

describe('evaluateFrame', () => {
  it('is readyForCapture for a good pose under good quality', () => {
    const result = evaluateFrame(
      GOOD_FRONT_POSE,
      { brightness: 130, blurScore: 80, motionDelta: 0.002 },
      'front',
    );
    expect(result.readyForCapture).toBe(true);
    expect(result.primaryHint).toBeNull();
  });

  it('prioritizes a pose issue over a quality issue of equal severity', () => {
    const result = evaluateFrame(
      null, // no_person_detected, severity 3
      { brightness: 30, blurScore: 80, motionDelta: 0 }, // too_dark, severity 2
      'front',
    );
    expect(result.primaryHint).toBe('Step into frame so your whole body is visible');
  });
});

describe('AutoCaptureTracker', () => {
  it('does not fire before enough consecutive good frames', () => {
    const tracker = new AutoCaptureTracker();
    const goodResult = evaluateFrame(
      GOOD_FRONT_POSE,
      { brightness: 130, blurScore: 80, motionDelta: 0.002 },
      'front',
    );
    for (let i = 0; i < AUTO_CAPTURE_CONSECUTIVE_FRAMES - 1; i++) {
      expect(tracker.update(goodResult)).toBe(false);
    }
  });

  it('fires exactly once after the required number of consecutive good frames', () => {
    const tracker = new AutoCaptureTracker();
    const goodResult = evaluateFrame(
      GOOD_FRONT_POSE,
      { brightness: 130, blurScore: 80, motionDelta: 0.002 },
      'front',
    );
    let fireCount = 0;
    for (let i = 0; i < AUTO_CAPTURE_CONSECUTIVE_FRAMES + 5; i++) {
      if (tracker.update(goodResult)) fireCount += 1;
    }
    expect(fireCount).toBe(1);
  });

  it('resets the streak when a bad frame interrupts it', () => {
    const tracker = new AutoCaptureTracker();
    const goodResult = evaluateFrame(
      GOOD_FRONT_POSE,
      { brightness: 130, blurScore: 80, motionDelta: 0.002 },
      'front',
    );
    const badResult = evaluateFrame(null, { brightness: 130, blurScore: 80, motionDelta: 0 }, 'front');

    for (let i = 0; i < AUTO_CAPTURE_CONSECUTIVE_FRAMES - 1; i++) {
      tracker.update(goodResult);
    }
    tracker.update(badResult); // interrupts the streak
    for (let i = 0; i < AUTO_CAPTURE_CONSECUTIVE_FRAMES - 1; i++) {
      expect(tracker.update(goodResult)).toBe(false);
    }
    expect(tracker.update(goodResult)).toBe(true);
  });

  it('can fire again after reset()', () => {
    const tracker = new AutoCaptureTracker();
    const goodResult = evaluateFrame(
      GOOD_FRONT_POSE,
      { brightness: 130, blurScore: 80, motionDelta: 0.002 },
      'front',
    );
    for (let i = 0; i < AUTO_CAPTURE_CONSECUTIVE_FRAMES; i++) {
      tracker.update(goodResult);
    }
    tracker.reset();
    for (let i = 0; i < AUTO_CAPTURE_CONSECUTIVE_FRAMES - 1; i++) {
      expect(tracker.update(goodResult)).toBe(false);
    }
    expect(tracker.update(goodResult)).toBe(true);
  });
});
