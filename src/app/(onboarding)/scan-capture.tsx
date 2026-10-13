import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, useCameraDevice, useFrameProcessor, VisionCameraProxy } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { CadeniqueLoader } from '../../components/ui/CadeniqueLoader';
import { theme, useTheme, ColorTokens } from '../../components/theme';
import { evaluateFrame, AutoCaptureTracker } from '../../lib/poseMatching';
import {
  FrameQualityMetrics,
  PoseLandmarks,
  PoseMatchResult,
  ScanAngle,
} from '../../lib/poseMatching.types';
import { CapturedAngleImage, ScanUploadError, uploadScan } from '../../lib/scans';

// Walk-around order — confirmed with Aziz. Changing this is a one-line
// edit, nothing else in the file depends on the specific sequence.
const ANGLES: ScanAngle[] = ['front', 'right', 'back', 'left'];

const ANGLE_LABELS: Record<ScanAngle, string> = {
  front: 'Front',
  right: 'Right side',
  back: 'Back',
  left: 'Left side',
};

const COUNTDOWN_START = 3;
const COUNTDOWN_STEP_MS = 800;

type Stage = 'positioning' | 'countdown' | 'capturing' | 'uploading' | 'error';

/**
 * Full-bleed camera screen driving the 4-angle body scan. Not wrapped in
 * the OnboardingStep/Screen chrome used elsewhere — a camera view needs
 * the whole screen, not a padded content area with a progress bar.
 *
 * ============================================================
 * KNOWN GAP, not a bug: frame QUALITY metrics (brightness/blur/motion)
 * are stubbed as constant "always passes" values below. The native
 * frame-processor plugin (Task #4) only returns pose landmarks right
 * now — it doesn't compute blur/lighting/motion from the camera buffer
 * yet. Auto-capture is therefore gated ONLY by pose geometry, not actual
 * image sharpness or lighting. The Kotlin plugin already decodes a
 * Bitmap per frame, so adding real quality metrics there later is a
 * contained follow-up, not a rewrite — see MERGE_INSTRUCTIONS.md.
 * ============================================================
 */
export default function ScanCaptureStep() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const device = useCameraDevice('back');
useEffect(() => {
  const devices = Camera.getAvailableCameraDevices();
  console.log('[scan-capture] available camera devices:', JSON.stringify(devices, null, 2));
}, []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('positioning');
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_START);
  const [matchResult, setMatchResult] = useState<PoseMatchResult | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedAngleImage[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const cameraRef = useRef<Camera>(null);
  const trackerRef = useRef(new AutoCaptureTracker());
  const stageRef = useRef<Stage>('positioning');
  const angleRef = useRef<ScanAngle>(ANGLES[0]);

  const currentAngle = ANGLES[currentIndex];

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    angleRef.current = currentAngle;
    trackerRef.current.reset();
    setMatchResult(null);
  }, [currentAngle]);

  // Runs on the JS thread, called from the worklet below via
  // Worklets.createRunOnJS. Reads stage/angle through refs (not state)
  // so this callback never needs to change identity — the frame
  // processor only needs to be rebuilt if `plugin` itself changes.
  const handlePoseLandmarks = useCallback((landmarks: PoseLandmarks | null) => {
    if (stageRef.current !== 'positioning') return;

    // See the KNOWN GAP note in the file doc comment above.
    const stubQuality: FrameQualityMetrics = { brightness: 130, blurScore: 100, motionDelta: 0 };

    const result = evaluateFrame(landmarks, stubQuality, angleRef.current);
    setMatchResult(result);

    const shouldStartCountdown = trackerRef.current.update(result);
    if (shouldStartCountdown) {
      setCountdownValue(COUNTDOWN_START);
      setStage('countdown');
    }
  }, []);

  const setPoseResultJS = useMemo(
    () => Worklets.createRunOnJS(handlePoseLandmarks),
    [handlePoseLandmarks],
  );

  const plugin = useMemo(() => VisionCameraProxy.initFrameProcessorPlugin('detectPose', {}), []);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (!plugin) return;
      const landmarks = plugin.call(frame) as unknown as PoseLandmarks | null;
      setPoseResultJS(landmarks);
    },
    [plugin, setPoseResultJS],
  );

  const handleCapture = useCallback(async () => {
    setStage('capturing');
    try {
      const camera = cameraRef.current;
      if (!camera) throw new Error('Camera not ready');

      const photo = await camera.takePhoto({ flash: 'off' });
      const uri = `file://${photo.path}`;
      const angle = angleRef.current;

      setCapturedImages((prev) => [...prev, { angle, uri }]);

      if (currentIndex + 1 < ANGLES.length) {
        setCurrentIndex((i) => i + 1);
        setStage('positioning');
      } else {
        setStage('uploading');
      }
    } catch (err) {
      // Capture failed (rare, but a cold camera session or storage
      // hiccup can cause this) — drop back to positioning and let the
      // tracker re-arm for this same angle rather than silently losing
      // the angle entirely.
      console.error('[scan-capture] takePhoto failed', err);
      trackerRef.current.reset();
      setStage('positioning');
    }
  }, [currentIndex]);

  // Countdown ticker — runs while stage === 'countdown', fires the
  // actual capture once it reaches 0.
  useEffect(() => {
    if (stage !== 'countdown') return;

    if (countdownValue <= 0) {
      handleCapture();
      return;
    }

    const timer = setTimeout(() => {
      setCountdownValue((v) => v - 1);
    }, COUNTDOWN_STEP_MS);

    return () => clearTimeout(timer);
  }, [stage, countdownValue, handleCapture]);

  // Fires once all 4 angles are captured.
  useEffect(() => {
    if (stage !== 'uploading') return;

    let cancelled = false;
    (async () => {
      try {
        await uploadScan(capturedImages);
        if (!cancelled) router.replace('/');
      } catch (err) {
        console.error('[scan-capture] upload failed', err);
        if (cancelled) return;
        setUploadError(
          err instanceof ScanUploadError ? err.message : 'Upload failed. Check your connection and try again.',
        );
        setStage('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stage, capturedImages]);

  const handleRetryUpload = () => {
    setUploadError(null);
    setStage('uploading');
  };

  if (!device) {
    return (
      <SafeAreaView style={styles.centerFill}>
        <Text style={styles.hintText}>No camera available on this device.</Text>
      </SafeAreaView>
    );
  }

  const cameraActive = stage !== 'error';

  return (
    <View style={styles.flex}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={cameraActive}
        photo
        frameProcessor={stage === 'positioning' ? frameProcessor : undefined}
      />

      <SafeAreaView style={styles.overlayFill} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Text style={styles.angleCount}>
            {currentIndex + 1} / {ANGLES.length}
          </Text>
          <View style={styles.dotsRow}>
            {ANGLES.map((angle, i) => (
              <View
                key={angle}
                style={[
                  styles.dot,
                  i < currentIndex && styles.dotDone,
                  i === currentIndex && styles.dotCurrent,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.spacer} />

        {stage === 'positioning' || stage === 'countdown' || stage === 'capturing' ? (
          <View style={styles.bottomCard}>
            <Text style={styles.angleLabel}>{ANGLE_LABELS[currentAngle]}</Text>
            <Text style={styles.hintText}>
              {matchResult?.primaryHint ?? 'Step into frame so your whole body is visible'}
            </Text>
            <ProgressBar step={matchResult?.overallScore ?? 0} totalSteps={100} />
          </View>
        ) : null}
      </SafeAreaView>

      {stage === 'countdown' ? (
        <View style={styles.centerOverlay} pointerEvents="none">
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownNumber}>{countdownValue}</Text>
          </View>
        </View>
      ) : null}

      {stage === 'uploading' ? (
        <View style={styles.fullOverlay}>
          <CadeniqueLoader />
          <Text style={styles.uploadingText}>Uploading your scan…</Text>
        </View>
      ) : null}

      {stage === 'error' ? (
        <View style={styles.fullOverlay}>
          <Text style={styles.errorText}>{uploadError ?? 'Something went wrong.'}</Text>
          <Button label="Retry upload" onPress={handleRetryUpload} style={styles.retryButton} />
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.black },
    centerFill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: theme.spacing.lg,
    },
    overlayFill: {
      flex: 1,
      justifyContent: 'space-between',
    },
    topBar: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      alignItems: 'center',
    },
    angleCount: {
      ...theme.typography.caption,
      color: colors.white,
      marginBottom: theme.spacing.xs,
    },
    dotsRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: theme.radius.full,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dotDone: {
      backgroundColor: colors.primary,
    },
    dotCurrent: {
      backgroundColor: colors.white,
    },
    spacer: { flex: 1 },
    bottomCard: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    angleLabel: {
      ...theme.typography.label,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    hintText: {
      ...theme.typography.bodyMedium,
      color: colors.white,
    },
    centerOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countdownCircle: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.full,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countdownNumber: {
      ...theme.typography.display,
      color: colors.white,
    },
    fullOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
    },
    uploadingText: {
      ...theme.typography.body,
      color: colors.white,
    },
    errorText: {
      ...theme.typography.body,
      color: colors.white,
      textAlign: 'center',
    },
    retryButton: {
      minWidth: 200,
    },
  });
}