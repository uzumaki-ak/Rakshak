import color from "@/shared/color";
import { supabase } from "@/config/SupabaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
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
  TextInput,
  View,
  useColorScheme,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import Typewriter from "./../components/type-writer";
import { useAuthContext } from "@/context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const theme = themeStyles(isDark ? "dark" : "light");

  const { user, isLoading } = useAuthContext();
  const router = useRouter();
  
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/(tabs)/Home");
    }
  }, [user, isLoading]);

  const onAuthPress = async () => {
    if (!email || !password || (authMode === "signUp" && !fullName)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoginLoading(true);
    try {
      if (authMode === "signUp") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        
        if (error) throw error;
        
        // Manual profile creation if needed (Trigger is preferred, but this is a fallback)
        if (data.user) {
            await supabase.from('users').insert([{
                id: data.user.id,
                clerk_user_id: data.user.id, // Keeping compatibility for now
                email: email,
                full_name: fullName,
                is_active: true
            }]);
        }

        Alert.alert("Success", "Account created! You can now sign in.");
        setAuthMode("signIn");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      Alert.alert("Error", err.message || "Authentication failed");
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading || user) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={color.PRIMARY} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
                "Your Smart Health Assistant",
              ]}
              typingSpeed={100}
              deleteSpeed={100}
              pauseDuration={1200}
              spaceBetween={false}
              textStyle={[styles.title, { color: theme.title }]}
            />
            
            <Text style={[styles.subtitle, { color: theme.subtitle }]}>
              Secure your health history with Supabase Auth.
            </Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            {authMode === "signUp" && (
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", color: theme.title }]}
                placeholder="Full Name"
                placeholderTextColor={isDark ? "#8E8E93" : "#C7C7CC"}
                value={fullName}
                onChangeText={setFullName}
              />
            )}
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", color: theme.title }]}
              placeholder="Email"
              placeholderTextColor={isDark ? "#8E8E93" : "#C7C7CC"}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", color: theme.title }]}
              placeholder="Password"
              placeholderTextColor={isDark ? "#8E8E93" : "#C7C7CC"}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setAuthMode(authMode === "signIn" ? "signUp" : "signIn")}
            >
              <Text style={{ color: color.PRIMARY, fontSize: 14, fontFamily: "PoppinsRegular" }}>
                {authMode === "signIn" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Animated Login Button */}
          <AnimatedLoginButton
            onPress={onAuthPress}
            loading={loginLoading}
            theme={theme}
            mode={authMode}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AnimatedLoginButton({
  onPress,
  loading,
  theme,
  mode
}: {
  onPress: () => void;
  loading: boolean;
  theme: any;
  mode: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(-1)).current;

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
              {mode === "signIn" ? "Log In" : "Create Account"}
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
    paddingTop: Platform.OS === "android" ? 40 : 60,
    paddingBottom: 40,
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
    marginBottom: 24,
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
    marginBottom: 0,
    lineHeight: 22,
    paddingHorizontal: 6,
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  input: {
    height: 54,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: "PoppinsRegular",
  },
  toggleButton: {
    alignItems: "center",
    marginTop: 8,
  },
});

const localStyles = StyleSheet.create({
  buttonWrap: {
    width: 220,
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

