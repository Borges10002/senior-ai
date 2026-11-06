export function getErrorMessage(error: any, defaultMsg = 'Ocorreu um erro inesperado.') {
  if (!error) return defaultMsg;
  if (typeof error === 'string') return error;
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (error.message) return error.message;
  return defaultMsg;
}
