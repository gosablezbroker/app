// Service worker mínimo: hace que Android/Chrome ofrezca instalar la app en la
// pantalla de inicio. No guarda nada en caché y no intercepta los pedidos, así
// que la web siempre se ve actualizada y el ingreso/consultas no cambian.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
