import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Platform, View } from "react-native";

import { formatarData, fromISODate, toISODate } from "@/domain/format";
import { espaco } from "@/ui/theme";

import { Campo, Chip, Texto } from "./base";

/** Seletor de data com atalhos "Hoje"/"Ontem". Valor em YYYY-MM-DD. */
export function CampoData({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: string;
  onChange: (iso: string) => void;
}) {
  const agora = new Date();
  const hoje = toISODate(agora);
  const ontem = toISODate(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1));

  const abrirAndroid = () =>
    DateTimePickerAndroid.open({
      value: fromISODate(valor),
      mode: "date",
      onChange: (evento, data) => {
        if (evento.type === "set" && data) onChange(toISODate(data));
      },
    });

  return (
    <View style={{ gap: espaco.xs }}>
      <Texto variante="legenda" secundario>
        {rotulo}
      </Texto>
      <View style={{ flexDirection: "row", gap: espaco.sm, flexWrap: "wrap", alignItems: "center" }}>
        <Chip rotulo="Hoje" ativo={valor === hoje} onPress={() => onChange(hoje)} />
        <Chip rotulo="Ontem" ativo={valor === ontem} onPress={() => onChange(ontem)} />
        {Platform.OS === "android" && (
          <Chip
            icone="calendar-outline"
            rotulo={valor !== hoje && valor !== ontem ? formatarData(valor) : "Outra data"}
            ativo={valor !== hoje && valor !== ontem}
            onPress={abrirAndroid}
          />
        )}
        {Platform.OS === "ios" && (
          <DateTimePicker
            value={fromISODate(valor)}
            mode="date"
            display="compact"
            onChange={(_, data) => data && onChange(toISODate(data))}
          />
        )}
      </View>
      {Platform.OS === "web" && (
        <Campo
          value={valor}
          onChangeText={onChange}
          placeholder="AAAA-MM-DD"
        />
      )}
    </View>
  );
}
