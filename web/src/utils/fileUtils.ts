function createFileFromSignatureData(data: any) {
  const byteCharacters = atob(data.split(",")[1]);
  const byteArray = new Uint8Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  const blob = new Blob([byteArray], { type: "image/png" });
  const file = new File([blob], "assinatura.png", { type: "image/png" });

  return file;
}

export default () => ({
  createFileFromSignatureData,
});
