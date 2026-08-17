import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Category, 
  Product, 
  Review, 
  Coupon, 
  Order, 
  UserProfile, 
  SiteSettings, 
  PermissionTemplate 
} from '../types';

export const COL_CATEGORIES = 'categories';
export const COL_PRODUCTS = 'products';
export const COL_ORDERS = 'orders';
export const COL_COUPONS = 'coupons';
export const COL_REVIEWS = 'reviews';
export const COL_USERS = 'users';
export const COL_SETTINGS = 'settings';
export const COL_PERMISSION_TEMPLATES = 'permissionTemplates';
export const COL_METADATA = 'metadata';

export async function fetchCategoriesFromFirestore(): Promise<Category[]> {
  const q = query(collection(db, COL_CATEGORIES), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Category);
}

export async function upsertCategoryInFirestore(category: Category): Promise<void> {
  await setDoc(doc(db, COL_CATEGORIES, category.id), category);
}

export async function deleteCategoryInFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_CATEGORIES, id));
}

export async function fetchProductsFromFirestore(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, COL_PRODUCTS));
  return snapshot.docs.map(doc => doc.data() as Product);
}

export async function upsertProductInFirestore(product: Product): Promise<void> {
  await setDoc(doc(db, COL_PRODUCTS, product.id), product);
}

export async function deleteProductInFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_PRODUCTS, id));
}

export async function fetchOrdersFromFirestore(): Promise<Order[]> {
  const q = query(collection(db, COL_ORDERS), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Order);
}

export async function upsertOrderInFirestore(order: Order): Promise<void> {
  await setDoc(doc(db, COL_ORDERS, order.id), order);
}

export async function deleteOrderInFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_ORDERS, id));
}

export async function fetchCouponsFromFirestore(): Promise<Coupon[]> {
  const snapshot = await getDocs(collection(db, COL_COUPONS));
  return snapshot.docs.map(doc => doc.data() as Coupon);
}

export async function upsertCouponInFirestore(coupon: Coupon): Promise<void> {
  await setDoc(doc(db, COL_COUPONS, coupon.id), coupon);
}

export async function deleteCouponInFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_COUPONS, id));
}

export async function fetchReviewsFromFirestore(): Promise<Review[]> {
  const q = query(collection(db, COL_REVIEWS), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Review);
}

export async function upsertReviewInFirestore(review: Review): Promise<void> {
  await setDoc(doc(db, COL_REVIEWS, review.id), review);
}

export async function deleteReviewInFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_REVIEWS, id));
}

export async function fetchUsersFromFirestore(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(db, COL_USERS));
  return snapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function fetchUserFromFirestore(id: string): Promise<UserProfile | null> {
  const docRef = doc(db, COL_USERS, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function upsertUserInFirestore(user: UserProfile): Promise<void> {
  await setDoc(doc(db, COL_USERS, user.id), user);
}

export async function deleteUserInFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_USERS, id));
}

export async function fetchSettingsFromFirestore(): Promise<SiteSettings | null> {
  const docRef = doc(db, COL_SETTINGS, 'site_settings');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as SiteSettings;
  }
  return null;
}

export async function upsertSettingsInFirestore(settings: SiteSettings): Promise<void> {
  await setDoc(doc(db, COL_SETTINGS, 'site_settings'), settings);
}

export async function fetchPermissionTemplatesFromFirestore(): Promise<PermissionTemplate[]> {
  const snapshot = await getDocs(collection(db, COL_PERMISSION_TEMPLATES));
  return snapshot.docs.map(doc => doc.data() as PermissionTemplate);
}

export async function upsertPermissionTemplateInFirestore(template: PermissionTemplate): Promise<void> {
  await setDoc(doc(db, COL_PERMISSION_TEMPLATES, template.id), template);
}

export async function deletePermissionTemplateInFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, COL_PERMISSION_TEMPLATES, id));
}

export async function syncInitialDataToFirestore(data: any): Promise<void> {
  const batch = writeBatch(db);
  
  if (data.categories) {
    data.categories.forEach((item: any) => {
      batch.set(doc(db, COL_CATEGORIES, item.id), item);
    });
  }
  if (data.products) {
    data.products.forEach((item: any) => {
      batch.set(doc(db, COL_PRODUCTS, item.id), item);
    });
  }
  if (data.coupons) {
    data.coupons.forEach((item: any) => {
      batch.set(doc(db, COL_COUPONS, item.id), item);
    });
  }
  if (data.users) {
    data.users.forEach((item: any) => {
      batch.set(doc(db, COL_USERS, item.id), item);
    });
  }
  if (data.settings) {
    batch.set(doc(db, COL_SETTINGS, 'site_settings'), data.settings);
  }
  
  await batch.commit();
}
