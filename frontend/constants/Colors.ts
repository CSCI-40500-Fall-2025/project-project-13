/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0aa42b';
const tintColorDark = '#4d824d';

export const Colors = {
  light: {
    text: '#178f31',
    background: '#81d481',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E0E0E0',
    clubPageBackground: '#26152B', // Main dark purple for Club Hub page
    clubSectionBackground: '#26152B', // Same as page background for sections
    clubCardBackground: '#3A2840', // Slightly lighter dark purple for cards
    purpleAccent: '#6a0dad', // brighter purple for accents if needed
  },
  dark: {
    text: '#b4e0b4',
    background: '#0f1a10',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#404040',
    clubPageBackground: '#26152B', // Main dark purple for Club Hub page
    clubSectionBackground: '#26152B', // Same as page background for sections
    clubCardBackground: '#3A2840', // Slightly lighter dark purple for cards
    purpleAccent: '#6a0dad', // A brighter purple for accents
  },
};
