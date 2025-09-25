// Typewriter.tsx
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TextStyle, View } from "react-native";

type TypewriterProps = {
  texts?: string[];
  typingSpeed?: number; // ms per char
  deleteSpeed?: number;
  pauseDuration?: number;
  spaceBetween?: boolean;
  textStyle?: TextStyle | TextStyle[];
};

export default function Typewriter({
  texts = ["Welcome", "स्वागत", "ようこそ"],
  typingSpeed = 120,
  deleteSpeed = 50,
  pauseDuration = 1000,
  spaceBetween = true,
  textStyle = {},
}: TypewriterProps) {
  const [langIndex, setLangIndex] = useState(0);
  const [raw, setRaw] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");
  const mounted = useRef(true);

  // Animated opacity for blinking cursor
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    mounted.current = true;

    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    blink.start();

    return () => {
      mounted.current = false;
      cursorOpacity.stopAnimation();
      blink.stop();
    };
  }, [cursorOpacity]);

  useEffect(() => {
    if (!mounted.current) return;

    let timeout: number | null = null;
    const target = texts[langIndex] ?? "";
    const chars = [...target];

    if (phase === "typing") {
      if (raw.length < chars.length) {
        timeout = setTimeout(() => {
          if (!mounted.current) return;
          setRaw((prev) => prev + chars[prev.length]);
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => {
          if (!mounted.current) return;
          setPhase("deleting");
        }, pauseDuration);
      }
    } else if (phase === "deleting") {
      if (raw.length > 0) {
        timeout = setTimeout(() => {
          if (!mounted.current) return;
          setRaw((prev) => prev.slice(0, prev.length - 1));
        }, deleteSpeed);
      } else {
        timeout = setTimeout(() => {
          if (!mounted.current) return;
          setLangIndex((i) => (i + 1) % texts.length);
          setPhase("typing");
        }, 200);
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [raw, phase, langIndex, texts, typingSpeed, deleteSpeed, pauseDuration]);

  const displayed = spaceBetween ? [...raw].join(" ") : raw;

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={[{ fontSize: 24 }, textStyle]}>{displayed}</Text>
      <Animated.Text
        style={[
          { fontSize: 24, marginLeft: 4, opacity: cursorOpacity },
          textStyle,
        ]}
      >
        |
      </Animated.Text>
    </View>
  );
}
