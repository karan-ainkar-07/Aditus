-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SYSTEM_ADMIN', 'PATIENT', 'CLINIC_STAFF');

-- CreateEnum
CREATE TYPE "ClinicRole" AS ENUM ('CLINIC_ADMIN', 'DOCTOR', 'ATTENDANT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PENDING_ACTIVATION', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ClinicStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneVerifiedAt" TIMESTAMP(3),
    "passwordHash" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "accountType" "AccountType" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicInfo" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "status" "ClinicStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientInfo" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "PatientInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorInfo" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "specialization" TEXT,

    CONSTRAINT "DoctorInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendantInfo" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "AttendantInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicMembership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "role" "ClinicRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "PatientInfo_userId_key" ON "PatientInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorInfo_userId_key" ON "DoctorInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendantInfo_userId_key" ON "AttendantInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicMembership_userId_key" ON "ClinicMembership"("userId");

-- CreateIndex
CREATE INDEX "ClinicMembership_clinicId_role_idx" ON "ClinicMembership"("clinicId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- AddForeignKey
ALTER TABLE "ClinicInfo" ADD CONSTRAINT "ClinicInfo_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientInfo" ADD CONSTRAINT "PatientInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorInfo" ADD CONSTRAINT "DoctorInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendantInfo" ADD CONSTRAINT "AttendantInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicMembership" ADD CONSTRAINT "ClinicMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicMembership" ADD CONSTRAINT "ClinicMembership_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "ClinicInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
