import Ionicons from "@expo/vector-icons/Ionicons";
import Tabs from "expo-router/js-tabs";

import type { IconName } from "@/ui/components/base";
import { useTema } from "@/ui/theme";

const abas: { nome: string; titulo: string; icone: IconName; iconeAtivo: IconName }[] = [
  { nome: "index", titulo: "Início", icone: "home-outline", iconeAtivo: "home" },
  { nome: "reunioes", titulo: "Reuniões", icone: "people-outline", iconeAtivo: "people" },
  { nome: "mais", titulo: "Mais", icone: "menu-outline", iconeAtivo: "menu" },
];

export default function TabsLayout() {
  const { cores } = useTema();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda },
        tabBarLabelStyle: { fontWeight: "600" },
      }}
    >
      {abas.map((aba) => (
        <Tabs.Screen
          key={aba.nome}
          name={aba.nome}
          options={{
            title: aba.titulo,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? aba.iconeAtivo : aba.icone}
                size={size}
                color={typeof color === "string" ? color : undefined}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
