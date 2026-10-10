import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import { theme } from '../components/theme';

const WELCOME_SEEN_KEY = 'cadenique-welcome-seen';
const SWIPE_THRESHOLD = 40;

const slides = [
  {
    image: require('../../assets/images/welcome-background-1.jpg'),
    eyebrow: 'TRAIN SMART',
    title: [
      [{ text: 'YOUR BODY.' }],
      [{ text: 'YOUR PLAN.', highlight: true }],
    ],
    description: 'Personalized training and nutrition plans to help you reach your goals faster and smarter.',
  },
  {
    image: require('../../assets/images/welcome-background-2.jpg'),
    eyebrow: 'FUEL YOUR PROGRESS',
    title: [
      [{ text: 'BETTER' }],
      [{ text: 'NUTRITION.' }],
      [{ text: 'REAL RESULTS.', highlight: true }],
    ],
    description: 'Track your nutrition, stay consistent and give your body what it needs to perform.',
  },
  {
    image: require('../../assets/images/welcome-background-3.jpg'),
    eyebrow: 'TRACK · IMPROVE · STAY CONSISTENT',
    title: [
      [{ text: 'A STRONGER' }],
      [{ text: 'YOU ' }, { text: 'EVERYDAY.', highlight: true }],
    ],
    description: 'Track your workouts, monitor your progress and stay motivated on your fitness journey.',
  },
];

export default function WelcomeScreen() {
  const styles = useMemo(() => makeStyles(), []);
  const [slideIndex, setSlideIndex] = useState(0);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentOffset = useRef(new Animated.Value(0)).current;
  const slide = slides[slideIndex];

  useEffect(() => {
    contentOpacity.setValue(0);
    contentOffset.setValue(8);

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(contentOffset, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOffset, contentOpacity, slideIndex]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Capture clearly horizontal drags before children can claim them.
        onMoveShouldSetPanResponderCapture: (_, g) =>
          Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -SWIPE_THRESHOLD) {
            // swipe left → next slide
            setSlideIndex((current) => Math.min(current + 1, slides.length - 1));
          } else if (g.dx > SWIPE_THRESHOLD) {
            // swipe right → previous slide
            setSlideIndex((current) => Math.max(current - 1, 0));
          }
        },
      }),
    []
  );

  const handleStart = async () => {
    await SecureStore.setItemAsync(WELCOME_SEEN_KEY, 'true');
    router.replace('/');
  };

  const handleNext = () => {
    if (slideIndex === slides.length - 1) {
      handleStart();
      return;
    }
    setSlideIndex((current) => current + 1);
  };

  return (
    // Plain View receives the pan handlers (ImageBackground would forward them to its inner Image)
    <View style={styles.root} {...panResponder.panHandlers}>
      <ImageBackground source={slide.image} style={styles.background} imageStyle={styles.backgroundImage}>
        <StatusBar style="light" />
        <View style={styles.scrim} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Image
                source={require('../../assets/branding/logos/wordmark-white.png')}
                style={styles.wordmark}
                resizeMode="contain"
                accessibilityLabel="CADENIQUE"
              />
              <Pressable onPress={handleStart} hitSlop={12} style={({ pressed }) => pressed && styles.pressed}>
                <Text style={styles.skip}>Skip</Text>
              </Pressable>
            </View>

            <Animated.View
              style={[
                styles.bottom,
                { opacity: contentOpacity, transform: [{ translateY: contentOffset }] },
              ]}
            >
              <View style={styles.accentLine} />
              <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
              <Text style={styles.title}>
                {slide.title.map((line, lineIndex) => (
                  <Text key={lineIndex}>
                    {line.map((part) => (
                      <Text key={part.text} style={part.highlight ? styles.highlight : undefined}>
                        {part.text}
                      </Text>
                    ))}
                    {lineIndex < slide.title.length - 1 ? '\n' : ''}
                  </Text>
                ))}
              </Text>
              <Text style={styles.description}>{slide.description}</Text>

              <View style={styles.controls}>
                <View style={styles.dots}>
                  {slides.map((_, index) => (
                    <View key={index} style={[styles.dot, index === slideIndex && styles.activeDot]} />
                  ))}
                </View>
                {slideIndex < slides.length - 1 ? (
                  <Pressable
                    onPress={handleNext}
                    style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
                    accessibilityLabel="Next"
                  >
                    <ArrowRight color="#FFFFFF" size={24} strokeWidth={1.8} />
                  </Pressable>
                ) : null}
              </View>

              {slideIndex === slides.length - 1 ? (
                <Pressable
                  onPress={handleNext}
                  style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryCtaText}>GET STARTED</Text>
                </Pressable>
              ) : null}

              {slideIndex === slides.length - 1 ? (
                <Pressable
                  onPress={handleStart}
                  style={({ pressed }) => [styles.accountLink, pressed && styles.pressed]}
                >
                  <Text style={styles.accountText}>I ALREADY HAVE AN ACCOUNT</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#000000',
    },
    background: {
      flex: 1,
      backgroundColor: '#000000',
    },
    backgroundImage: {
      resizeMode: 'cover',
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.48)',
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      justifyContent: 'space-between',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginLeft: -theme.spacing.sm,
    },
    wordmark: {
      width: 222,
      height: 46,
    },
    skip: {
      ...theme.typography.body,
      color: '#FFFFFF',
    },
    pressed: {
      opacity: 0.68,
    },
    bottom: {
      paddingBottom: theme.spacing.xs,
    },
    accentLine: {
      width: 34,
      height: 5,
      backgroundColor: '#E1E100',
      marginBottom: theme.spacing.sm,
    },
    eyebrow: {
      ...theme.typography.caption,
      color: '#D7DED3',
      letterSpacing: 1.5,
      marginBottom: theme.spacing.sm,
    },
    title: {
      ...theme.typography.display,
      color: '#FFFFFF',
      fontSize: 36,
      lineHeight: 38,
      fontWeight: '800',
    },
    highlight: {
      color: '#E1E100',
    },
    description: {
      ...theme.typography.body,
      color: '#FFFFFF',
      marginTop: theme.spacing.md,
      maxWidth: 340,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xl,
    },
    dots: {
      flexDirection: 'row',
      gap: 8,
    },
    dot: {
      width: 16,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
    },
    activeDot: {
      width: 32,
      backgroundColor: '#E1E100',
    },
    nextButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: 'rgba(225, 225, 0, 0.65)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryCta: {
      height: 56,
      borderRadius: 28,
      backgroundColor: '#E1E100',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.lg,
    },
    primaryCtaText: {
      ...theme.typography.bodyMedium,
      color: '#000000',
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    accountLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.lg,
    },
    accountText: {
      ...theme.typography.caption,
      color: '#FFFFFF',
      letterSpacing: 1,
    },
  });
}