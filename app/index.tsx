import { supabase } from "@/config/SupabaseConfig";
import color from "@/shared/color";
import { useAuth, useSSO, useUser } from "@clerk/clerk-expo";
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

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

interface UserProfile {
  clerk_user_id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  country?: string;
  timezone?: string;
  preferred_language?: string;
  push_notifications_enabled?: boolean;
  email_notifications_enabled?: boolean;
  reminder_notifications_enabled?: boolean;
  data_sharing_consent?: boolean;
  analytics_consent?: boolean;
  marketing_consent?: boolean;
  last_login_at?: string;
}

export default function Index() {
  // ALWAYS call hooks in the same order and unconditionally:
  const scheme = useColorScheme(); // moved to top to fix hook-order issues
  const effective = scheme === "dark" ? "dark" : "light";
  const theme = themeStyles(effective);

  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    console.log("Auth state changed:", { isSignedIn });

    if (isSignedIn) {
      router.replace("/(tabs)/Home");
    }
    if (isSignedIn !== undefined) {
      setLoading(false);
    }
  }, [isSignedIn]);

  useWarmUpBrowser();

  const { startSSOFlow } = useSSO();

  // Helper: robust email extraction + fallback
  const extractClerkEmail = (clerkUser: any) => {
    const email =
      clerkUser?.emailAddress ??
      clerkUser?.email ??
      clerkUser?.primaryEmailAddress?.emailAddress ??
      clerkUser?.emailAddresses?.[0]?.emailAddress ??
      clerkUser?.userData?.email ??
      null;

    if (!email) {
      const fallback = `unknown+${clerkUser?.id ?? Date.now()}@example.com`;
      console.warn(
        "Clerk user missing email — using fallback synthetic email:",
        fallback,
        "Full clerk object:",
        JSON.stringify(clerkUser, null, 2)
      );
      return fallback;
    }
    return email;
  };

  // Function to create or update user in Supabase
  const createOrUpdateUserInSupabase = async (
    clerkUser: any,
    isNewUser: boolean = false
  ) => {
    try {
      console.log("Creating/updating user in Supabase:", clerkUser.id);

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      const country = locale.split("-")[1] || "US";

      const resolvedEmail = extractClerkEmail(clerkUser);

      const userData: UserProfile = {
        clerk_user_id: clerkUser.id,
        email: resolvedEmail,
        full_name:
          clerkUser.fullName ||
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        phone:
          clerkUser.primaryPhoneNumber?.phoneNumber ||
          clerkUser.phoneNumbers?.[0]?.phoneNumber,
        avatar_url: clerkUser.imageUrl,
        country: country,
        timezone: timezone,
        preferred_language: locale.split("-")[0] || "en",
        push_notifications_enabled: true,
        email_notifications_enabled: true,
        reminder_notifications_enabled: true,
        data_sharing_consent: false,
        analytics_consent: false,
        marketing_consent: false,
        last_login_at: new Date().toISOString(),
      };

      if (isNewUser) {
        const { data, error } = await supabase
          .from("users")
          .insert([userData])
          .select()
          .single();

        if (error) {
          console.error("Error creating user in Supabase:", error);
          throw error;
        }

        console.log("New user created successfully in Supabase:", data);

        await createDefaultHealthProfile(data.id);

        return data;
      } else {
        const { data, error } = await supabase
          .from("users")
          .update({
            full_name: userData.full_name,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            avatar_url: userData.avatar_url,
            last_login_at: userData.last_login_at,
          })
          .eq("clerk_user_id", clerkUser.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating user in Supabase:", error);
          throw error;
        }

        console.log("User updated successfully in Supabase:", data);
        return data;
      }
    } catch (error) {
      console.error("Error in createOrUpdateUserInSupabase:", error);
      throw error;
    }
  };

  // Function to create default health profile
  const createDefaultHealthProfile = async (userId: string) => {
    try {
      const { error } = await supabase.from("user_health_profiles").insert([
        {
          user_id: userId,
          known_allergies: [],
          chronic_conditions: [],
          current_medications: [],
        },
      ]);

      if (error) {
        console.error("Error creating health profile:", error);
      } else {
        console.log("Default health profile created");
      }
    } catch (error) {
      console.error("Error in createDefaultHealthProfile:", error);
    }
  };

  // Function to check if user exists in Supabase
  const checkUserExists = async (clerkUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, clerk_user_id")
        .eq("clerk_user_id", clerkUserId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking user existence:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in checkUserExists:", error);
      return null;
    }
  };

  // Function to log user activity
  const logUserActivity = async (
    userId: string,
    activityType: string,
    activityData: any = {}
  ) => {
    try {
      await supabase.from("user_activities").insert([
        {
          user_id: userId,
          activity_type: activityType,
          activity_data: activityData,
          platform: Platform.OS,
          app_version: "1.0.0",
        },
      ]);
    } catch (error) {
      console.error("Error logging user activity:", error);
    }
  };

  const onLoginPress = useCallback(async () => {
    console.log("Login button pressed");
    setLoginLoading(true);

    try {
      console.log("Starting SSO flow...");

      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "your-app-scheme",
        }),
      });

      console.log("SSO flow result:", result);

      const { createdSessionId, setActive, signIn, signUp } = result;

      if (signUp) {
        console.log("New user signup detected");
        try {
          await createOrUpdateUserInSupabase(signUp, true);
          console.log("New user document created successfully in Supabase");
        } catch (supabaseError) {
          console.error(
            "Error creating user document in Supabase:",
            supabaseError
          );
          Alert.alert(
            "Account Created",
            "Your account was created but some features may not work properly. Please contact support if issues persist."
          );
        }
      }

      // In your onLoginPress function, replace this section:
      if (signIn && signIn.status === "complete") {
        console.log("Existing user login detected");
        try {
          if (signIn.id) {
            const existingUser = await checkUserExists(signIn.id);
            if (existingUser) {
              await createOrUpdateUserInSupabase(signIn, false);
              await logUserActivity(existingUser.id, "login", {
                login_method: "google_oauth",
                timestamp: new Date().toISOString(),
              });
            } else {
              await createOrUpdateUserInSupabase(signIn, true);
            }
          } else {
            console.error(
              "signIn.id is undefined, cannot check user existence."
            );
            // Fallback: try to create/update with the Clerk user object directly
            await createOrUpdateUserInSupabase(signIn, true);
          }
        } catch (supabaseError) {
          console.error(
            "Error handling existing user in Supabase:",
            supabaseError
          );
        }
      }

      if (createdSessionId) {
        console.log("Setting active session...");
        if (typeof setActive === "function") {
          await setActive({
            session: createdSessionId,
          });
        } else {
          console.warn("setActive is undefined, cannot set active session.");
        }
      } else if (signIn && signIn.status !== "complete") {
        console.log("Sign in incomplete, additional steps required");
        Alert.alert(
          "Additional Verification Required",
          "Please complete the verification process."
        );
      }
    } catch (err) {
      console.error("Login error:", JSON.stringify(err, null, 2));

      let errorMessage = "Something went wrong. Please try again.";

      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof (err as { code?: unknown }).code === "string"
      ) {
        const errorCode = (err as { code: string }).code;
        if (errorCode === "form_identifier_not_found") {
          errorMessage =
            "Account not found. Please check your email or sign up.";
        } else if (errorCode === "session_exists") {
          errorMessage = "You're already signed in.";
        } else if (errorCode.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        }
      }

      Alert.alert("Login Error", errorMessage);
    } finally {
      setLoginLoading(false);
    }
  }, [startSSOFlow, router]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={color.WHITE} />
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
            "Welcome to Medicine Assistant",
            "दवा सहायक में आपका स्वागत है",
            "薬のアシスタントへようこそ",
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

      {/* Animated / polished Login Button (keeps same behavior) */}
      <AnimatedLoginButton
        onPress={onLoginPress}
        loading={loginLoading}
        theme={theme}
      />
    </View>
  );
}

/* Animated Login Button component:
   - Uses Animated for press-scale + subtle pulse + shimmer
   - Keeps same onPress and disabled behavior as original TouchableOpacity
*/
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

  React.useEffect(() => {
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

  React.useEffect(() => {
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
