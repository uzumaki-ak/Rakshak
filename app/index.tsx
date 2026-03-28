import color from "@/shared/color";
import { useAuth, useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Typewriter from "./../components/type-writer";

/**
 * useWarmUpBrowser
 * Optimization for expo-web-browser to speed up login redirect
 */
export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const scheme = useColorScheme();
  const effective = scheme === "dark" ? "dark" : "light";
  const theme = themeStyles(effective);

  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const { startSSOFlow } = useSSO();

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/(tabs)/Home");
    }
    if (isLoaded) {
      setLoading(false);
    }
  }, [isSignedIn, isLoaded]);

  useWarmUpBrowser();

  /**
   * onLoginPress
   * Triggers Clerk OAuth flow. 
   * Global synchronization is handled by RootLayout's SyncWrapper.
   */
  const onLoginPress = useCallback(async () => {
    if (loginLoading) return;
    
    setLoginLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "rakshak", // Ensure this matches your app.json scheme
        }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("Login Error:", err);
      Alert.alert(
        "Login Failed",
        "Could not sign in with Google. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  }, [startSSOFlow, loginLoading]);

  // Loading state
  if (loading || (isLoaded && isSignedIn)) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={"#A67B2A"} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Image block */}
      <View style={styles.imageWrap}>
        <Image
          source={require("./../assets/my-assets/login.png")}
          style={[
            styles.image,
            theme.imageTint ? { tintColor: theme.imageTint } : {},
          ]}
        />
      </View>

      {/* Text & animation */}
      <View style={styles.content}>
        <Typewriter
          texts={[
            "Welcome to Rakshak",
            "दवा सहायक में आपका स्वागत है",
            "Your Smart Medicine Guide",
          ]}
          typingSpeed={100}
          deleteSpeed={100}
          pauseDuration={1200}
          spaceBetween={false}
          textStyle={[styles.title, { color: theme.title }]}
        />

        <Text style={[styles.subtitle, { color: theme.subtitle }]}>
          Your smart medicine expiry & health assistant — track medicines, get
          AI health insights, never miss expiry dates.
        </Text>
      </View>

      {/* Animated Login Button */}
      <AnimatedLoginButton
        onPress={onLoginPress}
        loading={loginLoading}
        theme={theme}
      />
    </View>
  );
}

function AnimatedLoginButton({
  onPress,
  loading,
  theme,
}: {
  onPress: () => void;
  loading: boolean;
  theme: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulse]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const shadowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.06, 0.28],
  });
  const shadowRadius = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 16],
  });
  const shimmerTranslate = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: [-280, 280],
  });

  return (
    <Animated.View
      style={[
        localStyles.buttonWrap,
        {
          transform: [{ scale }],
          shadowColor: theme.shadowColor,
          shadowOpacity,
          shadowRadius,
          elevation: 6,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={loading}
      >
        <LinearGradient
          colors={theme.gradient}
          start={[0, 0]}
          end={[1, 1]}
          style={localStyles.button}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.buttonText} />
          ) : (
            <Text style={[localStyles.buttonText, { color: theme.buttonText }]}>
              Get Started
            </Text>
          )}

          <Animated.View
            pointerEvents="none"
            style={[
              localStyles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
                backgroundColor: theme.shimmerColor,
                opacity: theme.shimmerOpacity,
              },
            ]}
          />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const themeStyles = (scheme: "light" | "dark") =>
  scheme === "dark"
    ? {
        background: "#0F0D0B",
        title: "#FFF8F0",
        subtitle: "#E6DCCF",
        gradient: ["#2b1a02", "#A67B2A"],
        buttonText: "#0B0B0B",
        shimmerColor: "rgba(255,255,255,0.12)",
        shimmerOpacity: 0.14,
        shadowColor: "#E6B75A",
        imageTint: null,
      }
    : {
        background: "#FBFDFF",
        title: "#102A43",
        subtitle: "#4F6D7A",
        gradient: ["#E6F7FA", "#E3F6F5"],
        buttonText: "#042A2B",
        shimmerColor: "rgba(255,255,255,0.78)",
        shimmerOpacity: 0.6,
        shadowColor: "#66A5AD",
        imageTint: null,
      };

const IMAGE_WIDTH = Dimensions.get("screen").width * 0.89;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 36,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageWrap: {
    marginBottom: 14,
    alignItems: "center",
    width: "100%",
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 0.6,
    resizeMode: "contain",
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 22,
    paddingHorizontal: 6,
  },
});

const localStyles = StyleSheet.create({
  buttonWrap: {
    width: 200,
    borderRadius: 14,
    overflow: "visible",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  shimmer: {
    position: "absolute",
    left: -280,
    top: 0,
    bottom: 0,
    width: 140,
    transform: [{ rotate: "22deg" }],
  },
});
