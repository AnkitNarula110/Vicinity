import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform, Animated } from 'react-native';
import { F } from '../theme/fonts';

interface ArcRingProps {
  percent?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

/**
 * ArcRing — circular progress indicator.
 * On web: uses conic-gradient (crisp, beautiful arc) with count-up animation.
 * On native: falls back to border circle with count-up.
 */
export default function ArcRing({
  percent = 0,
  size = 56,
  strokeWidth = 3,
  color = '#E84545',
  children,
}: ArcRingProps) {
  const [displayPct, setDisplayPct] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;
  const [angleState, setAngleState] = useState(0);

  useEffect(() => {
    // Count up text logic
    let start = 0;
    const end = percent;
    if (start === end) return;

    const duration = 1200;
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    
    const timer = setInterval(() => {
      current += increment;
      setDisplayPct(current);
      if (current === end) {
        clearInterval(timer);
      }
    }, Math.max(stepTime, 8));

    // Progress circle fill logic
    Animated.timing(animVal, {
      toValue: percent,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Listen to animated value to update state for web gradient background
    const listenerId = animVal.addListener(({ value }) => {
      setAngleState((value / 100) * 360);
    });

    return () => {
      clearInterval(timer);
      animVal.removeListener(listenerId);
    };
  }, [percent]);

  if (Platform.OS === 'web') {
    const innerSize = size - strokeWidth * 2;

    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
          // @ts-ignore
          boxShadow: `0 0 16px ${color}35`,
          // @ts-ignore
          backgroundImage: `conic-gradient(${color} ${angleState}deg, rgba(255,255,255,0.06) ${angleState}deg)`,
        } as any}
      >
        {/* Inner circle */}
        <View
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: 'rgba(9, 9, 15, 0.88)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {children || (
            <Text style={{ color, fontSize: size < 44 ? 9 : 16, fontWeight: '700', fontFamily: F.serif, letterSpacing: -0.5 }}>
              {displayPct}%
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Native fallback
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
      }}
    >
      {children || (
        <Text style={{ color, fontSize: size < 44 ? 9 : 16, fontWeight: '700', fontFamily: F.serif }}>
          {displayPct}%
        </Text>
      )}
    </View>
  );
}
