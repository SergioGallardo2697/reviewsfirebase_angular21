// Entidad base: todas las colecciones deben tener id y estatus (eliminación lógica)
export interface EntidadBase {
  id?: string;
  estatus: number;
}

export interface Vendedor extends EntidadBase {
  nombre: string;
  facebook: string;
  whatsapp: string;
}

export interface Paypal extends EntidadBase {
  banco: string;
  clabe: string;
  descripcion: string;
  navegador: string;
  propietario: string;
}

export interface Compra extends EntidadBase {
  fechaCompra: string;
  nombreProducto: string;
  precio: number;
  nombreVendedor: string;
  whatsappVendedor: string;
  facebookVendedor: string;
  plataforma: string;
  facebookWspUtilizado: string;
  navegadorUtilizado: string;
  paypal: string;
  ciudadentrega: string;
  idMercadolibre: string;
  usuario: string;
  bnecesitaImagen: boolean;
  bpublicoResena: boolean;
  bcompraPagada: boolean;
  bcompraEntregada: boolean;
  fechaEntrega: string;
}
