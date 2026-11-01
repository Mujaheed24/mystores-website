import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { app, getAuthClient } from "./firebaseApp";

export { app, getAuthClient };
export const db = getFirestore(app);
export const getStorageClient = () => getStorage(app);
