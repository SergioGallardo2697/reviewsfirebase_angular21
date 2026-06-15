import { Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { db } from './firebase.config';

import { EntidadBase, Vendedor, Paypal, Compra } from '../modelos/entidades';

// Re-exportar las interfaces para mantener compatibilidad con imports existentes
export type { EntidadBase, Vendedor, Paypal, Compra };

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

  // Escucha en tiempo real (onSnapshot) registros activos de cualquier colección.
  // Devuelve un Observable que cierra el listener al desuscribirse (teardown).
  // Acepta filtros/orden adicionales vía QueryConstraint (orderBy, where, etc.).
  escucharActivos<T extends EntidadBase>(nombreColeccion: string, ...restricciones: QueryConstraint[]): Observable<T[]> {
    return new Observable<T[]>(observer => {
      const q = query(collection(db, nombreColeccion), where('estatus', '==', 1), ...restricciones);
      return onSnapshot(
        q,
        snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as T))),
        err => observer.error(err)
      );
    });
  }

  // Wrappers específicos (azúcar sintáctico, mantienen retrocompatibilidad)
  obtenerVendedores = () => this.obtenerActivos<Vendedor>('vendedores');
  obtenerVendedoresOrdenados = () => this.obtenerActivosOrdenados<Vendedor>('vendedores', 'nombre');
  agregarVendedor = (vendedor: Omit<Vendedor, 'id'>) => this.agregar<Vendedor>('vendedores', vendedor);
  actualizarVendedor = (id: string, datos: Partial<Vendedor>) => this.actualizar<Vendedor>('vendedores', id, datos);
  eliminarVendedor = (id: string) => this.eliminarSuave('vendedores', id);

  vendedoresEnTiempoReal = () => this.escucharActivos<Vendedor>('vendedores', orderBy('nombre'));

  obtenerPaypals = () => this.obtenerActivos<Paypal>('paypals');
  obtenerPaypalsOrdenados = () => this.obtenerActivosOrdenados<Paypal>('paypals', 'descripcion');
  agregarPaypal = (paypal: Omit<Paypal, 'id'>) => this.agregar<Paypal>('paypals', paypal);
  actualizarPaypal = (id: string, datos: Partial<Paypal>) => this.actualizar<Paypal>('paypals', id, datos);
  eliminarPaypal = (id: string) => this.eliminarSuave('paypals', id);

  paypalsEnTiempoReal = () => this.escucharActivos<Paypal>('paypals', orderBy('descripcion'));

  agregarCompra = (compra: Omit<Compra, 'id'>) => this.agregar<Compra>('compras', compra);
  actualizarCompra = (id: string, datos: Partial<Compra>) => this.actualizar<Compra>('compras', id, datos);
  eliminarCompra = (id: string) => this.eliminarSuave('compras', id);

  // Listas de compras en tiempo real. tieneResena: true/false filtra no pagadas
  // con/sin reseña; null trae todas las activas.
  comprasEnTiempoReal(tieneResena: boolean | null): Observable<Compra[]> {
    if (tieneResena === null) {
      return this.escucharActivos<Compra>('compras', orderBy('fechaCreacion', 'asc'));
    }
    return this.escucharActivos<Compra>(
      'compras',
      where('bcompraPagada', '==', false),
      where('bpublicoResena', '==', tieneResena),
      orderBy('fechaCreacion', 'asc')
    );
  }

  // Consulta acotada por rango de fechaCompra (formato YYYY-MM-DD).
  // Reduce el costo al no traer toda la colección
  async obtenerComprasPorRangoFecha(fechaInicio: string, fechaFin: string): Promise<Compra[]> {
    const q = query(
      collection(db, 'compras'),
      where('estatus', '==', 1),
      where('fechaCompra', '>=', fechaInicio),
      where('fechaCompra', '<=', fechaFin),
      orderBy('fechaCompra')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Compra));
  }

  // Compras de un vendedor específico desde una fecha (YYYY-MM-DD) hasta hoy.
  // Requiere índice compuesto en Firestore: estatus + nombreVendedor + fechaCompra
  async obtenerComprasPorVendedorDesde(nombreVendedor: string, fechaDesde: string): Promise<Compra[]> {
    const q = query(
      collection(db, 'compras'),
      where('estatus', '==', 1),
      where('nombreVendedor', '==', nombreVendedor),
      where('fechaCompra', '>=', fechaDesde)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Compra));
  }

  // Todas las compras de un vendedor sin restricción de fecha
  async obtenerComprasPorVendedor(nombreVendedor: string): Promise<Compra[]> {
    const q = query(
      collection(db, 'compras'),
      where('estatus', '==', 1),
      where('nombreVendedor', '==', nombreVendedor)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Compra));
  }
}
