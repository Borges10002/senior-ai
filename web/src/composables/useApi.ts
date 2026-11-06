import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

export function useApi<T>() {
  const data = ref<T[]>([]);
  const loading = ref(false);
  const $q = useQuasar();

  const fetchData = async (endpoint: string) => {
    loading.value = true;
    try {
      const response = await api.get(endpoint);
      data.value = response.data;
    } catch (error: any) {
      $q.notify({ type: 'negative', message: 'Erro ao carregar dados' });
    } finally {
      loading.value = false;
    }
  };

  const createItem = async (endpoint: string, item: Partial<T>) => {
    loading.value = true;
    try {
      const response = await api.post(endpoint, item);
      data.value.push(response.data);
      $q.notify({ type: 'positive', message: 'Item criado com sucesso!' });
      return response.data;
    } catch (error: any) {
      $q.notify({ type: 'negative', message: 'Erro ao criar item' });
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateItem = async (endpoint: string, id: string, item: Partial<T>) => {
    loading.value = true;
    try {
      const response = await api.put(`${endpoint}/${id}`, item);
      const index = data.value.findIndex((i: any) => i.id === id);
      if (index !== -1) {
        data.value[index] = response.data;
      }
      $q.notify({ type: 'positive', message: 'Item atualizado com sucesso!' });
      return response.data;
    } catch (error: any) {
      $q.notify({ type: 'negative', message: 'Erro ao atualizar item' });
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteItem = async (endpoint: string, id: string) => {
    loading.value = true;
    try {
      await api.delete(`${endpoint}/${id}`);
      data.value = data.value.filter((i: any) => i.id !== id);
      $q.notify({ type: 'positive', message: 'Item excluído com sucesso!' });
    } catch (error: any) {
      $q.notify({ type: 'negative', message: 'Erro ao excluir item' });
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    loading,
    fetchData,
    createItem,
    updateItem,
    deleteItem
  };
}