import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Camera } from 'react-native-vision-camera';
import { Camera as CameraIcon } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { theme, useTheme, ColorTokens } from '../../components/theme';

/**
 * Sits between onboarding's summary step and the actual camera screen
 * (scan-capture.tsx). Explains what the scan is for and requests the
 * camera permission up front — scan-capture.tsx assumes permission is
 * already granted and does not re-request it itself.
 */
export default function ScanIntroStep() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

    const handleContinue = async () => {
    const currentStatus = Camera.getCameraPermissionStatus();
    console.log('[tro] button pressed, current permission status:', currentStatus);

    if (currentStatus === 'granted') {
      console.log('[tro] already granted, skipping requestCameraPermission entirely');
      router.push('/(onboarding)/scan-capture');
      return;
    }

    setRequesting(true);
    setDenied(false);
    try {
      console.log('[tro] calling requestCameraPermission...');
      const permission = await Camera.requestCameraPermission();
      console.log('[tro] requestCameraPermission resolved:', permission);
      if (permission === 'granted') {
        router.push('/(onboarding)/scan-capture');
      } else {
        setDenied(true);
      }
    } catch (err) {
      console.error('[tro] requestCameraPermission threw:', err);
      setDenied(true);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <CameraIcon color={colors.primary} size={40} strokeWidth={1.75} />
        </View>

        <Text style={styles.title}>Let's scan your physique</Text>
        <Text style={styles.subtitle}>
          Four quick photos — front, right side, back, left side. Stand a few steps back so your
          whole body fits in frame. We'll guide you into position and capture automatically once
          you're lined up.
        </Text>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Your photos are used only to assess your physique and build your plan. They're never
            shared and you can delete them anytime.
          </Text>
        </View>

        {denied ? (
          <Text style={styles.error}>
            Camera access was denied. Enable it in your device Settings to continue.
          </Text>
        ) : null}
      </View>

      <Button
        label="Enable camera"
        onPress={handleContinue}
        loading={requesting}
        style={styles.continueButton}
      />
    </Screen>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: theme.radius.full,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    title: {
      ...theme.typography.h1,
      color: colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.body,
      color: colors.textSecondary,
      marginBottom: theme.spacing.lg,
    },
    noteCard: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.md,
    },
    noteText: {
      ...theme.typography.caption,
      color: colors.textMuted,
    },
    error: {
      ...theme.typography.caption,
      color: colors.error,
      marginTop: theme.spacing.md,
    },
    continueButton: {
      marginBottom: theme.spacing.lg,
    },
  });
}