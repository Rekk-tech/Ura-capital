-- CreateTable: community_posts
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VISIBLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "removed_at" TIMESTAMP(3),

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "community_posts_status_check" CHECK ("status" IN ('VISIBLE', 'HIDDEN', 'REMOVED')),
    CONSTRAINT "community_posts_content_length_check" CHECK (char_length(trim(both E' \t\r\n' from "content")) >= 1 AND char_length("content") <= 5000)
);

-- CreateTable: community_comments
CREATE TABLE "community_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VISIBLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "removed_at" TIMESTAMP(3),

    CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "community_comments_status_check" CHECK ("status" IN ('VISIBLE', 'HIDDEN', 'REMOVED')),
    CONSTRAINT "community_comments_content_length_check" CHECK (char_length(trim(both E' \t\r\n' from "content")) >= 1 AND char_length("content") <= 2000)
);

-- CreateTable: community_post_likes
CREATE TABLE "community_post_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_likes_pkey" PRIMARY KEY ("id")
);

-- Indexes & Unique Constraints

-- community_posts indexes
CREATE INDEX "community_posts_status_created_at_id_idx" ON "community_posts"("status", "created_at" DESC, "id" DESC);
CREATE INDEX "community_posts_author_id_created_at_idx" ON "community_posts"("author_id", "created_at" DESC);
CREATE INDEX "community_posts_author_id_idx" ON "community_posts"("author_id");

-- community_comments indexes
CREATE INDEX "community_comments_post_id_created_at_id_idx" ON "community_comments"("post_id", "created_at" ASC, "id" ASC);
CREATE INDEX "community_comments_author_id_created_at_idx" ON "community_comments"("author_id", "created_at" DESC);
CREATE INDEX "community_comments_post_id_status_idx" ON "community_comments"("post_id", "status");
CREATE INDEX "community_comments_post_id_idx" ON "community_comments"("post_id");
CREATE INDEX "community_comments_author_id_idx" ON "community_comments"("author_id");

-- community_post_likes unique constraint & indexes
CREATE UNIQUE INDEX "community_post_likes_user_id_post_id_key" ON "community_post_likes"("user_id", "post_id");
CREATE INDEX "community_post_likes_post_id_idx" ON "community_post_likes"("post_id");
CREATE INDEX "community_post_likes_user_id_idx" ON "community_post_likes"("user_id");

-- Foreign Keys

-- community_posts -> users (ON DELETE RESTRICT)
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- community_comments -> community_posts & users (ON DELETE RESTRICT)
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- community_post_likes -> community_posts & users (ON DELETE CASCADE)
ALTER TABLE "community_post_likes" ADD CONSTRAINT "community_post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_post_likes" ADD CONSTRAINT "community_post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
