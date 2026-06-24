import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export function useBottomSheet(visible: boolean, onClose: () => void) {
  const backdrop = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(800)).current;

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
    ]).start(() => onClose());
  }

  return { backdrop, translateY, close };
}
