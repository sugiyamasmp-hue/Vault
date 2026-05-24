import { VaultItem, VaultItemInput } from "@/types/vault";

// ─── モード判定 ───────────────────────────────────────────────────────────────
const USE_MOCK = false;

// ─── Firebase シングルトン ─────────────────────────────────────────────────────
// Firebase の初期化を一度だけ行い、db / storage を使い回す

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

// ─── モックデータ ─────────────────────────────────────────────────────────────
let mockItems: VaultItem[] = [
  {
    id: "mock-1",
    category: "銀行口座",
    title: "PayPay銀行",
    content:
      "口座番号: 0012-3456789\n支店コード: 001 (ロケット支店)\nカナ氏名: ヤマダ タロウ\nIBAN: JP12 0000 0123 4567 89",
    remarks: "メインの給与振込先。毎月25日入金。",
    fileUrl: "",
    fileName: "",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "mock-2",
    category: "パスワード",
    title: "Googleアカウント",
    content:
      "メール: example@gmail.com\nパスワード: MySecure#Pass2024!\nリカバリー: +81-90-0000-0000",
    remarks: "2段階認証ON（Authenticatorアプリ使用）\nバックアップコードは金庫に保管",
    fileUrl: "",
    fileName: "",
    createdAt: new Date("2024-02-10"),
  },
  {
    id: "mock-3",
    category: "クレジットカード",
    title: "楽天カード (VISA)",
    content:
      "カード番号: 1234-5678-9012-3456\n有効期限: 12/27\nCVC: 123\n名義: TARO YAMADA",
    remarks: "メインカード。楽天ポイント積み立て用。\n引落口座: 楽天銀行",
    fileUrl: "",
    fileName: "",
    createdAt: new Date("2024-03-05"),
  },
  {
    id: "mock-4",
    category: "書類",
    title: "マイナンバーカード",
    content:
      "個人番号: 1234-5678-9012\n有効期限: 2034年10月\n電子証明書: 2029年10月",
    remarks:
      "スキャンコピーをDropboxに保存済み\n更新は市区町村窓口で手続き必要",
    fileUrl: "",
    fileName: "",
    createdAt: new Date("2024-04-20"),
  },
  {
    id: "mock-5",
    category: "その他",
    title: "自宅Wi-Fiパスワード",
    content:
      "SSID: MyHome_5G\nパスワード: wifi-secure-2024\nルーター管理IP: 192.168.1.1",
    remarks: "契約: NTTフレッツ光。2年毎に更新。",
    fileUrl: "",
    fileName: "",
    createdAt: new Date("2024-05-01"),
  },
];

// ─── CRUD（モック） ───────────────────────────────────────────────────────────

async function mockFetch(): Promise<VaultItem[]> {
  return [...mockItems].sort(
    (a, b) =>
      new Date(b.createdAt as Date).getTime() -
      new Date(a.createdAt as Date).getTime()
  );
}

async function mockAdd(input: VaultItemInput): Promise<VaultItem> {
  let fileUrl = "";
  let fileName = "";
  if (input.file) {
    fileUrl = URL.createObjectURL(input.file);
    fileName = input.file.name;
  }
  const newItem: VaultItem = {
    id: `mock-${Date.now()}`,
    category: input.category,
    title: input.title,
    content: input.content,
    remarks: input.remarks,
    fileUrl,
    fileName,
    createdAt: new Date(),
  };
  mockItems = [newItem, ...mockItems];
  return newItem;
}

async function mockUpdate(
  id: string,
  input: VaultItemInput
): Promise<VaultItem> {
  const existing = mockItems.find((i) => i.id === id);
  if (!existing) throw new Error("Item not found");

  let fileUrl = existing.fileUrl;
  let fileName = existing.fileName;
  if (input.file) {
    fileUrl = URL.createObjectURL(input.file);
    fileName = input.file.name;
  }
  const updated: VaultItem = {
    ...existing,
    category: input.category,
    title: input.title,
    content: input.content,
    remarks: input.remarks,
    fileUrl,
    fileName,
  };
  mockItems = mockItems.map((i) => (i.id === id ? updated : i));
  return updated;
}

async function mockDelete(id: string): Promise<void> {
  mockItems = mockItems.filter((i) => i.id !== id);
}

// ─── CRUD（Firebase） ─────────────────────────────────────────────────────────

async function firebaseFetch(): Promise<VaultItem[]> {
  const { db } = await getFirebase();
  const { collection, query, orderBy, getDocs } = await import(
    "firebase/firestore"
  );

  const snapshot = await getDocs(
    query(collection(db, "vaultItems"), orderBy("createdAt", "desc"))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as VaultItem));
}

async function firebaseAdd(input: VaultItemInput): Promise<VaultItem> {
  const { db, storage } = await getFirebase();
  const { collection, addDoc, updateDoc, serverTimestamp } = await import(
    "firebase/firestore"
  );
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

async function firebaseUpdate(
  id: string,
  input: VaultItemInput,
  existing?: VaultItem
): Promise<VaultItem> {
  const { db, storage } = await getFirebase();
  const { doc, updateDoc } = await import("firebase/firestore");
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

  // ファイルを変更しない場合は既存の値を引き継ぐ
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
      // ファイルが Storage に存在しない場合は無視
    }
  }
}

// ─── 公開 API ─────────────────────────────────────────────────────────────────

export async function fetchVaultItems(): Promise<VaultItem[]> {
  return USE_MOCK ? mockFetch() : firebaseFetch();
}

export async function addVaultItem(input: VaultItemInput): Promise<VaultItem> {
  return USE_MOCK ? mockAdd(input) : firebaseAdd(input);
}

export async function updateVaultItem(
  id: string,
  input: VaultItemInput,
  existing?: VaultItem
): Promise<VaultItem> {
  return USE_MOCK ? mockUpdate(id, input) : firebaseUpdate(id, input, existing);
}

export async function deleteVaultItem(
  id: string,
  fileUrl?: string
): Promise<void> {
  return USE_MOCK ? mockDelete(id) : firebaseDelete(id, fileUrl);
}
