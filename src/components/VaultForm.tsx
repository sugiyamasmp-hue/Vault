"use client";

import { useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  Category,
  VaultItem,
  VaultItemInput,
} from "@/types/vault";

interface VaultFormProps {
  onSubmit: (input: VaultItemInput, editId?: string) => Promise<void>;
  onClose?: () => void;
  editItem?: VaultItem | null;
}

const DEFAULT_CATEGORY: Category = "銀行口座";

const DEFAULT_FORM: VaultItemInput = {
  category: DEFAULT_CATEGORY,
  title: "",
  content: "",
  remarks: "",
  file: null,
};

export default function VaultForm({ onSubmit, onClose, editItem }: VaultFormProps) {
  const [form, setForm] = useState<VaultItemInput>(DEFAULT_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | "other" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevPreviewRef = useRef<string | null>(null);

  // editItem が変わったらフォームを同期
  useEffect(() => {
    if (editItem) {
      setForm({
        category: editItem.category,
        title: editItem.title,
        content: editItem.content,
        remarks: editItem.remarks,
        file: null,
      });
      if (editItem.fileUrl) {
        setPreviewUrl(editItem.fileUrl);
        const isImg = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(editItem.fileName);
        const isPdf = /\.pdf$/i.test(editItem.fileName);
        setPreviewType(isImg ? "image" : isPdf ? "pdf" : "other");
      } else {
        setPreviewUrl(null);
        setPreviewType(null);
      }
    } else {
      setForm(DEFAULT_FORM);
      setPreviewUrl(null);
      setPreviewType(null);
    }
    setError(null);
  }, [editItem]);

  // blob URL のクリーンアップ
  useEffect(() => {
    return () => {
      if (prevPreviewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(prevPreviewRef.current);
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 前の blob URL を破棄
    if (prevPreviewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(prevPreviewRef.current);
    }

    const isImg = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
    const isPdf = /\.pdf$/i.test(file.name);

    const url = URL.createObjectURL(file);
    prevPreviewRef.current = url;
    setPreviewUrl(url);
    setPreviewType(isImg ? "image" : isPdf ? "pdf" : "other");
    setForm((prev) => ({ ...prev, file }));
  };

  const handleRemoveFile = () => {
    if (prevPreviewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(prevPreviewRef.current);
      prevPreviewRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewType(null);
    setForm((prev) => ({ ...prev, file: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("名称を入力してください");
      return;
    }
    if (!form.content.trim()) {
      setError("内容を入力してください");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(form, editItem?.id);
      setForm(DEFAULT_FORM);
      setPreviewUrl(null);
      setPreviewType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cfg = CATEGORY_CONFIG[form.category];
  const isEdit = !!editItem;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* フォームヘッダー */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ backgroundColor: cfg.lightBg, borderBottom: `1px solid ${cfg.border}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{cfg.icon}</span>
          <h2 className="font-bold text-gray-800 text-base">
            {isEdit ? "情報を編集" : "新規登録"}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* カテゴリ選択 */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            カテゴリ
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {CATEGORIES.map((cat) => {
              const c = CATEGORY_CONFIG[cat];
              const active = form.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, category: cat }))}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: active ? c.color : c.badge,
                    borderColor: active ? c.color : c.border,
                    color: active ? "#fff" : c.badgeText,
                    boxShadow: active ? `0 0 0 2px ${c.color}40` : "none",
                  }}
                >
                  <span className="text-lg leading-none">{c.icon}</span>
                  <span className="truncate w-full text-center leading-tight">
                    {cat.length > 5 ? cat.slice(0, 4) + "…" : cat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 名称 */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="例: PayPay銀行、Googleアカウント"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
            style={{ "--tw-ring-color": cfg.color } as React.CSSProperties}
          />
        </div>

        {/* 内容（等幅フォント） */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder={"口座番号: 0000-0000000\nパスワード: xxxxxxxx"}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors resize-none leading-relaxed"
            style={{
              fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code","Courier New",monospace',
              "--tw-ring-color": cfg.color,
            } as React.CSSProperties}
          />
        </div>

        {/* 備考 */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            備考
          </label>
          <textarea
            value={form.remarks}
            onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
            placeholder="メモや補足情報を入力..."
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors resize-none"
            style={{ "--tw-ring-color": cfg.color } as React.CSSProperties}
          />
        </div>

        {/* ファイル添付 */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            ファイル添付
          </label>

          {!previewUrl ? (
            <label
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-opacity-70"
              style={{ borderColor: cfg.border, backgroundColor: cfg.lightBg }}
            >
              <svg className="w-8 h-8" style={{ color: cfg.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.344 11.095H6.75z" />
              </svg>
              <p className="text-sm font-medium" style={{ color: cfg.badgeText }}>
                クリックしてファイルを選択
              </p>
              <p className="text-xs text-gray-400">画像・PDF・その他（最大20MB）</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,*/*"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: cfg.border }}
            >
              {/* プレビュー */}
              {previewType === "image" && (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full max-h-48 object-contain bg-gray-50"
                />
              )}
              {previewType === "pdf" && (
                <iframe
                  src={previewUrl}
                  title="PDF preview"
                  className="w-full h-40 bg-white"
                />
              )}
              {previewType === "other" && (
                <div
                  className="flex items-center gap-2 p-3 text-sm font-medium"
                  style={{ backgroundColor: cfg.lightBg, color: cfg.badgeText }}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {form.file ? form.file.name : editItem?.fileName}
                </div>
              )}

              {/* 削除ボタン */}
              <button
                type="button"
                onClick={handleRemoveFile}
                className="w-full py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                ✕ ファイルを削除
              </button>
            </div>
          )}
        </div>

        {/* エラー */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
            {error}
          </div>
        )}

        {/* 送信ボタン */}
        <div className="flex gap-2 pt-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: isSubmitting ? "#9CA3AF" : cfg.color }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                保存中...
              </span>
            ) : isEdit ? (
              "✓ 更新する"
            ) : (
              "＋ 登録する"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
