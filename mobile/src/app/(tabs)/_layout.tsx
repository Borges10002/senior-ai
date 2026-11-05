import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

import { useTema } from "@/ui/theme";

export default function TabsLayout() {
  const { cores } = useTema();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Reuniões", tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={typeof color === "string" ? color : undefined} /> }}
      />
      <Tabs.Screen
        name="mais"
        options={{ title: "Mais", tabBarIcon: ({ color, size }) => <Ionicons name="menu" size={size} color={typeof color === "string" ? color : undefined} /> }}
      />
    </Tabs>
  );
}
