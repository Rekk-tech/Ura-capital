import React, { useState, useEffect } from "react";
import {
  Send,
  Loader2,
  MapPin,
  TrendingUp,
  HelpCircle,
  DollarSign,
  BarChart2,
  Image,
  Percent,
} from "lucide-react";
import { useCreatePostMutation } from "../hooks/use-community";
import { CommunityApiError } from "../types/community-ui.types";
import {
  CommunityRateLimitedBanner,
  CommunityServiceUnavailableBanner,
} from "./CommunityStates";

interface PostComposerProps {
  accessToken?: string;
  onPostCreated?: () => void;
  initialTitle?: string;
  initialContent?: string;
}

const MAX_POST_LENGTH = 5000;

type ComposerTab = "ANALYSIS" | "TRADE" | "QUESTION";

export const PostComposer: React.FC<PostComposerProps> = ({
  accessToken,
  onPostCreated,
  initialTitle = "",
  initialContent = "",
}) => {
  const [activeTab, setActiveTab] = useState<ComposerTab>("ANALYSIS");
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
    if (initialContent) setContent(initialContent);
  }, [initialTitle, initialContent]);

  const createPostMutation = useCreatePostMutation(accessToken);

  const trimmed = content.trim();
  const isTooLong = content.length > MAX_POST_LENGTH;
  const isSubmitting = createPostMutation.isPending;
  const canSubmit = trimmed.length > 0 && !isTooLong && !isSubmitting;

  const handleQuickInsert = (snippet: string) => {
    setContent((prev) => (prev ? `${prev} ${snippet}` : snippet));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (trimmed.length === 0) {
      setValidationError("Nội dung bài viết không được để trống.");
      return;
    }

    if (content.length > MAX_POST_LENGTH) {
      setValidationError(
        `Nội dung bài viết vượt quá độ dài tối đa ${MAX_POST_LENGTH} ký tự.`
      );
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        title: title.trim() || undefined,
        content,
      });
      setTitle("");
      setContent("");
      setValidationError(null);
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err: unknown) {
      if (err instanceof CommunityApiError) {
        if (err.status === 400) {
          setValidationError(err.message || "Nội dung bài viết không hợp lệ.");
        }
      } else {
        setValidationError("Không thể tạo bài viết. Vui lòng thử lại.");
      }
    }
  };

  const error = createPostMutation.error;
  const isRateLimited = error instanceof CommunityApiError && error.status === 429;
  const isServiceUnavailable =
    error instanceof CommunityApiError && error.status === 503;
  const retryAfter = isRateLimited ? error.retryAfter : undefined;

  return (
    <div className="card community-composer-card">
      <form onSubmit={handleSubmit} noValidate>
        {/* Top Composer Type Switcher Tabs */}
        <div className="composer-tabs-row">
          <button
            type="button"
            onClick={() => setActiveTab("ANALYSIS")}
            className={`composer-tab-btn ${activeTab === "ANALYSIS" ? "active" : ""}`}
          >
            <MapPin size={13} style={{ color: "#1D6FF2" }} />
            <span>Phân Tích & Luận Điểm</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TRADE")}
            className={`composer-tab-btn ${activeTab === "TRADE" ? "active" : ""}`}
          >
            <TrendingUp size={13} style={{ color: "#059669" }} />
            <span>Lệnh Giao Dịch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("QUESTION")}
            className={`composer-tab-btn ${activeTab === "QUESTION" ? "active" : ""}`}
          >
            <HelpCircle size={13} style={{ color: "#D97706" }} />
            <span>Câu Hỏi</span>
          </button>
        </div>

        {isRateLimited && <CommunityRateLimitedBanner retryAfter={retryAfter} />}
        {isServiceUnavailable && <CommunityServiceUnavailableBanner />}

        {/* Title Input */}
        <div>
          <input
            id="post-composer-title-input"
            data-testid="post-composer-title-input"
            type="text"
            className="composer-title-input"
            placeholder={
              activeTab === "ANALYSIS"
                ? "Tiêu đề thảo luận (ngắn gọn, tập trung luận điểm)..."
                : activeTab === "TRADE"
                ? "Mã cổ phiếu & Khớp lệnh chu kỳ (ví dụ: $FPT Long 112.5)..."
                : "Câu hỏi hoặc thắc mắc cần cộng đồng giải đáp..."
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            maxLength={150}
            title="Nhập tiêu đề cho bài viết thảo luận của bạn"
          />
        </div>

        {/* Textarea */}
        <div>
          <textarea
            id="post-composer-textarea"
            data-testid="post-composer-textarea"
            className="composer-textarea"
            placeholder="Chia sẻ góc nhìn phân tích, nhật ký lệnh hoặc chiến lược phân bổ danh mục..."
            rows={3}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (validationError) setValidationError(null);
            }}
            disabled={isSubmitting}
            aria-invalid={Boolean(validationError) || isTooLong}
            aria-describedby="post-composer-help post-composer-counter"
            title="Viết bài phân tích, đúc kết giao dịch hoặc câu hỏi thảo luận"
          />
        </div>

        {/* Bottom Toolbar */}
        <div className="composer-bottom-bar">
          {/* Quick Insert Pills */}
          <div className="composer-quick-insert-group">
            <button
              type="button"
              onClick={() => handleQuickInsert("$")}
              className="btn-quick-insert"
            >
              <DollarSign size={13} style={{ color: "#64748B" }} />
              <span>$Mã CP</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickInsert("[Biểu Đồ Kỹ Thuật]")}
              className="btn-quick-insert"
            >
              <BarChart2 size={13} style={{ color: "#64748B" }} />
              <span>Biểu Đồ</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickInsert("[Ảnh minh họa]")}
              className="btn-quick-insert"
              aria-label="Chèn hình ảnh"
              title="Chèn ảnh minh họa"
              style={{ padding: "0.35rem 0.5rem" }}
            >
              <Image size={14} style={{ color: "#64748B" }} />
            </button>

            <button
              type="button"
              onClick={() => handleQuickInsert("%")}
              className="btn-quick-insert"
              aria-label="Chèn tỷ lệ phần trăm"
              title="Chèn %"
              style={{ padding: "0.35rem 0.5rem", fontFamily: "var(--font-mono, monospace)", fontWeight: 800 }}
            >
              <Percent size={13} style={{ color: "#64748B" }} />
            </button>
          </div>

          {/* Right Counter & Submit Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              id="post-composer-counter"
              data-testid="post-composer-counter"
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.75rem",
                color: isTooLong ? "#E11D48" : "#94A3B8",
                fontWeight: isTooLong ? 800 : 500,
              }}
            >
              {content.length} / {MAX_POST_LENGTH}
            </div>

            <button
              type="submit"
              data-testid="post-composer-submit-btn"
              disabled={!canSubmit}
              title="Đăng bài viết này lên bảng tin cộng đồng"
              className="btn-submit-post"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  <span>Đang đăng...</span>
                </>
              ) : (
                <>
                  <Send size={14} aria-hidden="true" />
                  <span>Đăng Bài</span>
                </>
              )}
            </button>
          </div>
        </div>

        {validationError && (
          <div
            id="post-composer-help"
            role="alert"
            aria-live="polite"
            style={{ fontSize: "0.775rem", color: "#E11D48", marginTop: "0.5rem", fontWeight: 600 }}
          >
            {validationError}
          </div>
        )}
      </form>
    </div>
  );
};
