import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  StyleSheet,
  View,
} from 'react-native';

const splashBackground = require('../../../assets/images/Splashs creen/Écran Splash Néon du Coureur.png');
const wordmark = require('../../../assets/branding/logos/wordmark-white.png');

export function CadeniqueSplash() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start();
    return () => animation.stop();
  }, [progress]);

  return (
    <ImageBackground
      source={splashBackground}
      resizeMode="cover"
      style={styles.container}
      accessibilityLabel="Cadenique splash screen"
    >
      <View style={styles.branding}>
        <Image source={wordmark} resizeMode="contain" style={styles.wordmark} />
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 150],
                }),
              },
            ]}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020500',
  },
  branding: {
    position: 'absolute',
    bottom: '17%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  wordmark: {
    width: '62%',
    height: 76,
  },
  progressTrack: {
    width: 150,
    height: 8,
    marginTop: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(190, 220, 150, 0.45)',
    borderRadius: 4,
    backgroundColor: 'rgba(78, 94, 69, 0.95)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#E9FF00',
    shadowColor: '#E9FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
});
