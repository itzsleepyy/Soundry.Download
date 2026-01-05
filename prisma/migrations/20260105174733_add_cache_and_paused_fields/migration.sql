-- CreateTable
CREATE TABLE "ResolverCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MetadataCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SessionGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalTracks" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paused" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_SessionGroup" ("createdAt", "id", "sessionToken", "title", "totalTracks") SELECT "createdAt", "id", "sessionToken", "title", "totalTracks" FROM "SessionGroup";
DROP TABLE "SessionGroup";
ALTER TABLE "new_SessionGroup" RENAME TO "SessionGroup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ResolverCache_key_key" ON "ResolverCache"("key");

-- CreateIndex
CREATE UNIQUE INDEX "MetadataCache_key_key" ON "MetadataCache"("key");
