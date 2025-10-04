import { Stack } from "expo-router";

export default function AssistantLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create-agent"
        options={{
          title: "Create Agent",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="chat/new-chat"
        options={{
          title: "New Chat",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="chat/[sessionId]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="agents/[agentType]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}