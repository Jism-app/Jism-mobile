import { useRef } from 'react';
import { Animated, GestureResponderEvent, PanResponder, Pressable, View } from 'react-native';

// Pinch-to-zoom + pan + double-tap, built on PanResponder/Animated so it needs
// no extra native dependencies. `onActiveChange(true)` fires while zoomed so
// parent scrollers can lock themselves.

const MAX_ZOOM = 3;

interface ZoomableImageProps {
  uri: string;
  width: number;
  height: number;
  onActiveChange: (zoomed: boolean) => void;
}

export function ZoomableImage({ uri, width, height, onActiveChange }: ZoomableImageProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const cur = useRef({ s: 1, x: 0, y: 0 });
  const g = useRef({ n: 0, has: false, dist: null as number | null, cx: 0, cy: 0 });
  const lastTap = useRef(0);
  const dims = useRef({ width, height });
  const notify = useRef(onActiveChange);
  dims.current = { width, height };
  notify.current = onActiveChange;

  const apply = useRef((s: number, x: number, y: number) => {
    const ns = Math.min(MAX_ZOOM, Math.max(1, s));
    const maxX = ((ns - 1) * dims.current.width) / 2;
    const maxY = ((ns - 1) * dims.current.height) / 2;
    const nx = Math.min(maxX, Math.max(-maxX, x));
    const ny = Math.min(maxY, Math.max(-maxY, y));
    cur.current = { s: ns, x: nx, y: ny };
    scale.setValue(ns);
    tx.setValue(nx);
    ty.setValue(ny);
  }).current;

  const finish = useRef(() => {
    if (cur.current.s < 1.05) apply(1, 0, 0);
    notify.current(cur.current.s > 1.05);
  }).current;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length >= 2 || cur.current.s > 1.01,
      onMoveShouldSetPanResponderCapture: (e) =>
        e.nativeEvent.touches.length >= 2 || cur.current.s > 1.01,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        g.current = { n: 0, has: false, dist: null, cx: 0, cy: 0 };
        notify.current(true); // lock the parent scrollers while we own the gesture
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        const touches = e.nativeEvent.touches;
        const n = touches.length;
        const st = g.current;
        if (n === 0) return;
        if (n !== st.n) {
          st.n = n;
          st.has = false;
          st.dist = null;
        }
        const cx = touches.reduce((sum, t) => sum + t.pageX, 0) / n;
        const cy = touches.reduce((sum, t) => sum + t.pageY, 0) / n;
        let s = cur.current.s;
        if (n >= 2) {
          const d = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
          if (st.dist != null && st.dist > 0) s = cur.current.s * (d / st.dist);
          st.dist = d;
        }
        if (st.has) apply(s, cur.current.x + (cx - st.cx), cur.current.y + (cy - st.cy));
        st.cx = cx;
        st.cy = cy;
        st.has = true;
      },
      onPanResponderRelease: () => finish(),
      onPanResponderTerminate: () => finish(),
    }),
  ).current;

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      const target = cur.current.s > 1.05 ? 1 : 2.2;
      cur.current = { s: target, x: 0, y: 0 };
      notify.current(target > 1);
      Animated.parallel([
        Animated.timing(scale, { toValue: target, duration: 200, useNativeDriver: false }),
        Animated.timing(tx, { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(ty, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
    } else {
      lastTap.current = now;
    }
  };

  return (
    <View style={{ width, height, overflow: 'hidden' }} {...responder.panHandlers}>
      <Pressable onPress={handlePress} style={{ width, height }}>
        <Animated.Image
          source={{ uri }}
          resizeMode="contain"
          style={{ width, height, transform: [{ translateX: tx }, { translateY: ty }, { scale }] }}
        />
      </Pressable>
    </View>
  );
}
