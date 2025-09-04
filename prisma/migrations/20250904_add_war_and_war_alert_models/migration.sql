-- CreateTable
CREATE TABLE "War" (
    "id" TEXT NOT NULL,
    "pnwWarId" INTEGER NOT NULL,
    "allianceId" TEXT NOT NULL,
    "attackerId" INTEGER NOT NULL,
    "defenderId" INTEGER NOT NULL,
    "attackerName" TEXT,
    "defenderName" TEXT,
    "warType" TEXT,
    "groundControl" TEXT,
    "airSuperiority" TEXT,
    "navalBlockade" TEXT,
    "winner" INTEGER,
    "turnEnds" TIMESTAMP(3),
    "warStarted" TIMESTAMP(3) NOT NULL,
    "warEnded" TIMESTAMP(3),
    "isDefensive" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "War_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarAlert" (
    "id" TEXT NOT NULL,
    "warId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "War_pnwWarId_key" ON "War"("pnwWarId");

-- CreateIndex
CREATE INDEX "War_allianceId_isActive_idx" ON "War"("allianceId", "isActive");

-- CreateIndex
CREATE INDEX "War_pnwWarId_idx" ON "War"("pnwWarId");

-- CreateIndex
CREATE INDEX "WarAlert_warId_idx" ON "WarAlert"("warId");

-- AddForeignKey
ALTER TABLE "War" ADD CONSTRAINT "War_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "Alliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarAlert" ADD CONSTRAINT "WarAlert_warId_fkey" FOREIGN KEY ("warId") REFERENCES "War"("id") ON DELETE CASCADE ON UPDATE CASCADE;
