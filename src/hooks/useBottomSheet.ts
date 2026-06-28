import { useRef, useEffect } from 'react';
import { Animated, PanResponder } from 'react-native';

// Height of the drag handle zone at the top of the sheet (pill + padding)
const HANDLE_ZONE = 50;

export function useBottomSheet(visible: boolean, onClose: () => void) {
  const backdrop = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(800)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      backdrop.setValue(0);
      translateY.setValue(800);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 35,
          stiffness: 400,
          mass: 1,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(backdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function close() {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 800, duration: 220, useNativeDriver: true }),
    ]).start(() => onCloseRef.current());
  }

  const panResponder = useRef(
    PanResponder.create({
      // Only claim the touch on start if the finger is within the handle zone
      onStartShouldSetPanResponder: (e) => e.nativeEvent.locationY < HANDLE_ZONE,
      // Reclaim mid-gesture if dragging down and started near the top
      onMoveShouldSetPanResponder: (e, { dy, dx }) =>
        e.nativeEvent.locationY < HANDLE_ZONE && dy > 5 && dy > Math.abs(dx),
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 120 || vy > 0.5) {
          Animated.parallel([
            Animated.timing(backdrop, { toValue: 0, duration: 160, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 800, duration: 220, useNativeDriver: true }),
          ]).start(() => onCloseRef.current());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 35,
            stiffness: 400,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 35,
          stiffness: 400,
        }).start();
      },
    }),
  ).current;

  return { backdrop, translateY, close, panResponder };
}
