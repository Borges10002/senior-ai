jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
// Apenas o motor nativo é substituído; telas e gráficos reais continuam renderizados.
jest.mock('react-native-reanimated', () => {
  const { View, Text } = jest.requireActual('react-native');
  const identidade = (v: unknown) => v;
  return {
    __esModule: true,
    default: { View, Text, createAnimatedComponent: identidade },
    Easing: { out: identidade, inOut: identidade, cubic: identidade, quad: identidade },
    useSharedValue: (valor: unknown) => jest.requireActual('react').useRef({
      value: valor, get() { return this.value; }, set(v: unknown) { this.value = v; },
    }).current,
    useAnimatedStyle: (cb: () => unknown) => cb(),
    useAnimatedProps: (cb: () => unknown) => cb(),
    withTiming: identidade, withDelay: (_atraso: number, v: unknown) => v,
    withRepeat: identidade, withSequence: identidade,
  };
});
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, SafeAreaProvider: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true, default: 'DatePicker', DateTimePickerAndroid: { open: jest.fn() },
}));
jest.mock('@/infra/storage/preferencias-storage', () => ({
  carregarPreferenciaTema: async () => 'claro', salvarPreferenciaTema: jest.fn(),
}));
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: true }, jest.fn(async () => ({ granted: true }))],
  useMicrophonePermissions: () => [{ granted: true }, jest.fn(async () => ({ granted: true }))],
}));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
jest.mock('@/infra/storage/gravacao-local', () => ({
  guardarGravacao: jest.fn((_id: string, uri: string) => uri),
  gravacaoPendente: jest.fn(() => null),
  apagarGravacaoLocal: jest.fn(),
}));
