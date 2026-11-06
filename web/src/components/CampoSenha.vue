<template>
  <q-input v-model="valor" :type="visivel ? 'text' : 'password'" v-bind="$attrs">
    <template v-if="icone" #prepend>
      <q-icon :name="icone" />
    </template>
    <template #append>
      <q-icon
        :name="visivel ? 'visibility_off' : 'visibility'"
        class="cursor-pointer"
        role="button"
        tabindex="0"
        :aria-label="visivel ? 'Ocultar senha' : 'Mostrar senha'"
        @click="visivel = !visivel"
        @keydown.enter.prevent="visivel = !visivel"
      />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });
defineProps<{ icone?: string }>();

const valor = defineModel<string>({ default: "" });
const visivel = ref(false);
</script>
