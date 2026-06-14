import { Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase.config';

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

@Injectable({ providedIn: 'root' })
export class FirestoreService {

  // Métodos genéricos: nuevas colecciones solo necesitan extender EntidadBase
  async obtenerActivos<T extends EntidadBase>(nombreColeccion: string): Promise<T[]> {
    const q = query(collection(db, nombreColeccion), where('estatus', '==', 1));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
  }

  // Obtiene registros activos ordenados por un campo específico
  async obtenerActivosOrdenados<T extends EntidadBase>(nombreColeccion: string, campo: string): Promise<T[]> {
    const q = query(collection(db, nombreColeccion), where('estatus', '==', 1), orderBy(campo));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
  }

  async agregar<T extends EntidadBase>(nombreColeccion: string, item: Omit<T, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, nombreColeccion), item);
    return ref.id;
  }

  async actualizar<T extends EntidadBase>(nombreColeccion: string, id: string, datos: Partial<T>): Promise<void> {
    // Cast necesario porque Firestore tipa updateDoc estrictamente con el converter
    await updateDoc(doc(db, nombreColeccion, id), datos as { [x: string]: unknown });
  }

  async eliminarSuave(nombreColeccion: string, id: string): Promise<void> {
    await updateDoc(doc(db, nombreColeccion, id), { estatus: 0 });
  }

  // Wrappers específicos (azúcar sintáctico, mantienen retrocompatibilidad)
  obtenerVendedores = () => this.obtenerActivos<Vendedor>('vendedores');
  obtenerVendedoresOrdenados = () => this.obtenerActivosOrdenados<Vendedor>('vendedores', 'nombre');
  agregarVendedor = (vendedor: Omit<Vendedor, 'id'>) => this.agregar<Vendedor>('vendedores', vendedor);
  actualizarVendedor = (id: string, datos: Partial<Vendedor>) => this.actualizar<Vendedor>('vendedores', id, datos);
  eliminarVendedor = (id: string) => this.eliminarSuave('vendedores', id);

  obtenerPaypals = () => this.obtenerActivos<Paypal>('paypals');
  obtenerPaypalsOrdenados = () => this.obtenerActivosOrdenados<Paypal>('paypals', 'descripcion');
  agregarPaypal = (paypal: Omit<Paypal, 'id'>) => this.agregar<Paypal>('paypals', paypal);
  actualizarPaypal = (id: string, datos: Partial<Paypal>) => this.actualizar<Paypal>('paypals', id, datos);
  eliminarPaypal = (id: string) => this.eliminarSuave('paypals', id);

  obtenerCompras = () => this.obtenerActivos<Compra>('compras');
  agregarCompra = (compra: Omit<Compra, 'id'>) => this.agregar<Compra>('compras', compra);
  actualizarCompra = (id: string, datos: Partial<Compra>) => this.actualizar<Compra>('compras', id, datos);
  eliminarCompra = (id: string) => this.eliminarSuave('compras', id);
}
