"use client";

import { useState } from "react";
import { VaultItem, CATEGORY_CONFIG, getItemDate } from "@/types/vault";

interface VaultCardProps {
  item: VaultItem;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string, fileUrl?: string) => void;
}

export default function VaultCard({ item, onEdit, onDelete }: VaultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG["その他"];
  const date = getItemDate(item);
  const isImage = item.fileName && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.fileName);
  const isPdf = item.fileName && /\.pdf$/i.test(item.fileName);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.content);
    } catch {
      // フォールバック
      const ta = document.createElement("textarea");
      ta.value = item.content;
      Object.assign(ta.style, { position: "fixed", opacity: "0" });
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`「${item.title}」を削除しますか？\nこの操作は元に戻せません。`)) {
      onDelete(item.id, item.fileUrl || undefined);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item);
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-sm transition-shadow hover:shadow-md"
      style={{ backgroundColor: cfg.lightBg, borderColor: cfg.border }}
    >
      {/* ── カードヘッダー ── */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded((v) => !v)}
        role="button"
        aria-expanded={isExpanded}
      >
        {/* カテゴリアイコン */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: cfg.color }}
        >
          {cfg.icon}
        </div>

        {/* タイトル + バッジ */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-base leading-tight truncate">
            {item.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: cfg.badge, color: cfg.badgeText }}
            >
              {item.category}
            </span>
            {item.fileName && (
              <span className="text-xs text-gray-400 truncate max-w-[120px]">
                📎 {item.fileName}
              </span>
            )}
          </div>
        </div>

        {/* 日付 + シェブロン */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[11px] text-gray-400">
            {date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
          </span>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            style={{ color: cfg.badgeText }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* ── アコーディオン本体（グリッドトリック） ── */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: isExpanded ? "1fr" : "0fr",
          transition: "grid-template-rows 320ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div className="px-4 pb-4 space-y-3">
            {/* 区切り線 */}
            <div className="border-t" style={{ borderColor: cfg.border }} />

            {/* 内容（等幅フォント） */}
            {item.content && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                    内容
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                    style={{
                      backgroundColor: copied ? cfg.color : cfg.badge,
                      color: copied ? "#fff" : cfg.badgeText,
                    }}
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        コピー済み
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        コピー
                      </>
                    )}
                  </button>
                </div>
                <pre
                  className="text-sm p-3.5 rounded-xl whitespace-pre-wrap break-all leading-relaxed overflow-x-auto"
                  style={{
                    fontFamily:
                      '"JetBrains Mono","Fira Code","Cascadia Code","Courier New",monospace',
                    backgroundColor: "#0f172a",
                    color: "#7dd3fc",
                    fontSize: "0.8125rem",
                  }}
                >
                  {item.content}
                </pre>
              </div>
            )}

            {/* 備考 */}
            {item.remarks && (
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  備考
                </p>
                <p
                  className="text-sm text-gray-700 p-3 rounded-xl whitespace-pre-wrap leading-relaxed"
                  style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
                >
                  {item.remarks}
                </p>
              </div>
            )}

            {/* 添付ファイルプレビュー */}
            {item.fileUrl && (
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  添付ファイル
                </p>
                <div
                  className="rounded-xl overflow-hidden border"
                  style={{ borderColor: cfg.border }}
                >
                  {isImage && (
                    <img
                      src={item.fileUrl}
                      alt={item.fileName}
                      className="w-full max-h-60 object-contain bg-white"
                    />
                  )}
                  {isPdf && (
                    <iframe
                      src={item.fileUrl}
                      title={item.fileName}
                      className="w-full h-52 bg-white"
                    />
                  )}
                  {!isImage && !isPdf && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 p-3 text-sm font-medium hover:opacity-80 transition-opacity"
                      style={{ color: cfg.badgeText }}
                    >
                      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {item.fileName}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 操作ボタン */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleEdit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 hover:brightness-95"
                style={{ backgroundColor: cfg.badge, color: cfg.badgeText }}
              >
                ✏️ 編集
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 transition-all active:scale-95 hover:bg-red-100"
              >
                🗑️ 削除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
