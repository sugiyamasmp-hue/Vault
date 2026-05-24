import { VaultItem, VaultItemInput } from "@/types/vault";

const USE_MOCK = false;

type FirebaseInstances = {
  db: import("firebase/firestore").Firestore;
  storage: import("firebase/storage").FirebaseStorage;
};

let _firebase: FirebaseInstances | null = null;

async function getFirebase(): Promise<FirebaseInstances> {
  if (_firebase) return _firebase;

  const { getApps, initializeApp } = await import("firebase/app");
  const { getFirestore } = await import("firebase/firestore");
  const { getStorage } = await import("firebase/storage");

  const app =
    getApps().length === 0
      ? initializeApp({
          apiKey: "AIzaSyBplaq4hCnjbSm6erkJFSJDRkxC2r8ESGU",
          authDomain: "vault-app-3bdf8.firebaseapp.com",
          projectId: "vault-app-3bdf8",
          storageBucket: "vault-app-3bdf8.firebasestorage.app",
          messagingSenderId: "382817010411",
          appId: "1:382817010411:web:c61a250791b1d6e1a2f4ae",
        })
      : getApps()[0];

  _firebase = { db: getFirestore(app), storage: getStorage(app) };
  return _firebase;
}

async function firebaseFetch(): Promise<VaultItem[]> {
  const { db } = await getFirebase();
  const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
  const snapshot = await getDocs(query(collection(db, "vaultItems"), orderBy("createdAt", "desc")));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as VaultItem));
}

async function firebaseAdd(input: VaultItemInput): Promise<VaultItem> {
  const { db, storage } = await getFirebase();
  const { collection, addDoc, updateDoc, serverTimestamp } = await import("firebase/firestore");
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

  const docRef = await addDoc(collection(db, "vaultItems"), {
    category: input.category,
    title: input.title,
    content: input.content,
    remarks: input.remarks,
    fileUrl: "",
    fileName: "",
    createdAt: serverTimestamp(),
  });

  let fileUrl = "";
  let fileName = "";
  if (input.file) {
    const storageRef = ref(storage, `vault_files/${docRef.id}_${input.file.name}`);
    await uploadBytes(storageRef, input.file);
    fileUrl = await getDownloadURL(storageRef);
    fileName = input.file.name;
    await updateDoc(docRef, { fileUrl, fileName });
  }

  return {
    id: docRef.id,
    category: input.category,
    title: input.title,
    content: input.content,
    remarks: input.remarks,
    fileUrl,
    fileName,
    createdAt: new Date(),
  };
}

async function firebaseUpdate(id: string, input: VaultItemInput, existing?: VaultItem): Promise<VaultItem> {
  const { db, storage } = await getFirebase();
  const { doc, updateDoc } = await import("firebase/firestore");
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

  let fileUrl = existing?.fileUrl ?? "";
  let fileName = existing?.fileName ?? "";

  if (input.file) {
    const storageRef = ref(storage, `vault_files/${id}_${input.file.name}`);
    await uploadBytes(storageRef, input.file);
    fileUrl = await getDownloadURL(storageRef);
    fileName = input.file.name;
  }

  await updateDoc(doc(db, "vaultItems", id), {
    category: input.category,
    title: input.title,
    content: input.content,
    remarks: input.remarks,
    fileUrl,
    fileName,
  });

  return {
    id,
    category: input.category,
    title: input.title,
    content: input.content,
    remarks: input.remarks,
    fileUrl,
    fileName,
    createdAt: existing?.createdAt ?? new Date(),
  };
}

async function firebaseDelete(id: string, fileUrl?: string): Promise<void> {
  const { db, storage } = await getFirebase();
  const { doc, deleteDoc } = await import("firebase/firestore");
  const { ref, deleteObject } = await import("firebase/storage");

  await deleteDoc(doc(db, "vaultItems", id));

  if (fileUrl) {
    try {
      await deleteObject(ref(storage, fileUrl));
    } catch {
      // ファイルが存在しない場合は無視
    }
  }
}

export async function fetchVaultItems(): Promise<VaultItem[]> {
  return USE_MOCK ? [] : firebaseFetch();
}

export async function addVaultItem(input: VaultItemInput): Promise<VaultItem> {
  return USE_MOCK ? Promise.reject("Mock mode") : firebaseAdd(input);
}

export async function updateVaultItem(id: string, input: VaultItemInput, existing?: VaultItem): Promise<VaultItem> {
  return USE_MOCK ? Promise.reject("Mock mode") : firebaseUpdate(id, input, existing);
}

export async function deleteVaultItem(id: string, fileUrl?: string): Promise<void> {
  return USE_MOCK ? Promise.resolve() : firebaseDelete(id, fileUrl);
}
