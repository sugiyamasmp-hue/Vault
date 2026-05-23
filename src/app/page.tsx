"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  VaultItem,
  VaultItemInput,
} from "@/types/vault";
import {
  addVaultItem,
  deleteVaultItem,
  fetchVaultItems,
  updateVaultItem,
} from "@/lib/firebase";
import SearchFilter from "@/components/SearchFilter";
import VaultCard from "@/components/VaultCard";
import VaultForm from "@/components/VaultForm";

export default function Home() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 検索・フィルター状態
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // 編集対象
  const [editItem, setEditItem] = useState<VaultItem | null>(null);

  // モバイル用モーダル
  const [showModal, setShowModal] = useState(false);

  // ── データ取得 ──────────────────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    try {
      setFetchError(null);
      const data = await fetchVaultItems();
      setItems(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ── フィルタリング ──────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.remarks.toLowerCase().includes(q);
      const matchCat =
        categoryFilter === "all" || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  // カテゴリ別カウント（フィルター前）
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const cat of CATEGORIES) {
      c[cat] = items.filter((i) => i.category === cat).length;
    }
    return c;
  }, [items]);

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (input: VaultItemInput, editId?: string) => {
    if (editId) {
      const updated = await updateVaultItem(editId, input, editItem ?? undefined);
      setItems((prev) => prev.map((i) => (i.id === editId ? updated : i)));
      setEditItem(null);
    } else {
      const added = await addVaultItem(input);
      setItems((prev) => [added, ...prev]);
    }
    setShowModal(false);
  };

  const handleEdit = (item: VaultItem) => {
    setEditItem(item);
    // モバイル: モーダルを開く
    if (window.innerWidth < 768) {
      setShowModal(true);
    }
  };

  const handleDelete = async (id: string, fileUrl?: string) => {
    await deleteVaultItem(id, fileUrl);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (editItem?.id === id) setEditItem(null);
  };

  const handleNewItem = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditItem(null);
  };

  // ── レンダリング ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── ヘッダー ── */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-lg">
              🔐
            </div>
            <div>
              <h1 className="font-black text-gray-900 text-lg leading-none tracking-tight">
                Vault
              </h1>
              <p className="text-[11px] text-gray-400 leading-none mt-0.5">
                重要情報マネージャー
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* モック/Firebaseバッジ */}
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                process.env.NEXT_PUBLIC_FIREBASE_API_KEY
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "🔥 Firebase" : "🧪 Mock"}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {items.length}件
            </span>
          </div>
        </div>
      </header>

      {/* ── 検索 & フィルター ── */}
      <SearchFilter
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        counts={counts}
      />

      {/* ── メインコンテンツ ── */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        {fetchError && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3.5">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
            {fetchError}
            <button
              onClick={loadItems}
              className="ml-auto text-xs font-semibold underline"
            >
              再試行
            </button>
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* ── 左: カードリスト ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <LoadingSkeleton />
            ) : filteredItems.length === 0 ? (
              <EmptyState
                hasSearch={!!search || categoryFilter !== "all"}
                onAdd={handleNewItem}
              />
            ) : (
              <div className="space-y-3">
                {/* フィルター結果件数 */}
                {(search || categoryFilter !== "all") && (
                  <p className="text-xs text-gray-500 font-medium px-1">
                    {filteredItems.length}件表示中 / 全{items.length}件
                  </p>
                )}
                {filteredItems.map((item) => (
                  <VaultCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── 右: デスクトップ用フォーム（md以上で表示） ── */}
          <div className="hidden md:block w-96 shrink-0 sticky top-36">
            <VaultForm
              onSubmit={handleSubmit}
              editItem={editItem}
              onClose={editItem ? () => setEditItem(null) : undefined}
            />
          </div>
        </div>
      </main>

      {/* ── モバイル: 新規登録ボタン（FAB） ── */}
      <button
        onClick={handleNewItem}
        className="md:hidden fixed bottom-6 right-5 w-14 h-14 rounded-2xl bg-gray-900 text-white text-2xl shadow-xl flex items-center justify-center transition-transform active:scale-90 z-20"
        aria-label="新規登録"
      >
        ＋
      </button>

      {/* ── モバイル: ボトムシートモーダル ── */}
      {showModal && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* 背景オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/50 fade-in"
            onClick={handleCloseModal}
          />
          {/* ボトムシート */}
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-gray-100 max-h-[92dvh] overflow-y-auto slide-up">
            {/* ドラッグハンドル */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="px-4 pb-8">
              <VaultForm
                onSubmit={handleSubmit}
                editItem={editItem}
                onClose={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── サブコンポーネント ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-2xl bg-white animate-pulse"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  hasSearch: boolean;
  onAdd: () => void;
}

function EmptyState({ hasSearch, onAdd }: EmptyStateProps) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-gray-600 font-semibold">検索結果が見つかりません</p>
        <p className="text-sm text-gray-400 mt-1">別のキーワードをお試しください</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-6xl mb-4">🔐</span>
      <p className="text-gray-700 font-bold text-lg">まだ登録がありません</p>
      <p className="text-sm text-gray-400 mt-1 mb-6">
        重要な情報を安全に保管しましょう
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-semibold text-sm transition-transform active:scale-95 md:hidden"
      >
        ＋ 最初の情報を登録する
      </button>
      <p className="hidden md:block text-sm text-gray-400">
        右のフォームから登録できます
      </p>
    </div>
  );
}
