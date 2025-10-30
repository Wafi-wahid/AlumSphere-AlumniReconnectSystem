-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "sapId" TEXT,
    "batchSeason" TEXT,
    "batchYear" INTEGER,
    "gradSeason" TEXT,
    "gradYear" INTEGER,
    "linkedinId" TEXT,
    "profilePicture" TEXT,
    "program" TEXT,
    "currentCompany" TEXT,
    "skills" TEXT,
    "profileHeadline" TEXT,
    "location" TEXT,
    "experienceYears" INTEGER,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "mentorEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("batchSeason", "batchYear", "createdAt", "email", "gradSeason", "gradYear", "id", "linkedinId", "name", "passwordHash", "role", "sapId", "updatedAt") SELECT "batchSeason", "batchYear", "createdAt", "email", "gradSeason", "gradYear", "id", "linkedinId", "name", "passwordHash", "role", "sapId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_sapId_key" ON "User"("sapId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
