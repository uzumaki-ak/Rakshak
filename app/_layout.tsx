import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// // Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
      PoppinsRegular: require("../assets/fonts/Poppins/Poppins-Regular.ttf"),
      PoppinsThinItalic: require("../assets/fonts/Poppins/Poppins-ThinItalic.ttf"),
      PoppinsLight: require("../assets/fonts/Poppins/Poppins-Light.ttf"),
    });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ClerkProvider tokenCache={tokenCache}>
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
   </ClerkProvider>
  );
}
