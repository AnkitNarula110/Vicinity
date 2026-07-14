import React, { useRef, ComponentProps } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TabConfig {
  key: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  iconActive: ComponentProps<typeof Ionicons>['name'];
}

const TABS: TabConfig[] = [
  { key: 'nearby',  label: 'Nearby',  icon: 'radio-outline',        iconActive: 'radio' },
  { key: 'matches', label: 'Matches', icon: 'chatbubbles-outline',   iconActive: 'chatbubbles' },
  { key: 'profile', label: 'Profile', icon: 'person-circle-outline', iconActive: 'person-circle' },
];

interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  accent: string;
  unreadCount: number;
}

function TabItem({ tab, isActive, onPress, accent, unreadCount }: TabItemProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.84, duration: 80, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={s.tab}>
      <Animated.View style={[s.inner, { transform: [{ scale }] }]}>
        {isActive && (
          <View style={[s.activeBlob, { backgroundColor: `${accent}20` }]} />
        )}
        <View style={{ alignItems: 'center' }}>
          <Ionicons
            name={(isActive ? tab.iconActive : tab.icon) as any}
            size={23}
            color={isActive ? accent : 'rgba(255,255,255,0.28)'}
          />
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeNum}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={[s.label, { color: isActive ? accent : 'rgba(255,255,255,0.28)' }]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

interface BottomTabBarProps {
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  accent: string;
  unreadMatches?: number;
}

export default function BottomTabBar({ activeTab, onTabPress, accent, unreadMatches = 0 }: BottomTabBarProps) {
  return (
    <View style={s.bar}>
      <View style={s.row}>
        {TABS.map(tab => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={() => onTabPress(tab.key)}
            accent={accent}
            unreadCount={tab.key === 'matches' ? unreadMatches : 0}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(9,9,15,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 16,
    position: 'relative',
  },
  activeBlob: {
    position: 'absolute',
    width: 52,
    height: 32,
    borderRadius: 16,
    top: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeNum: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});
