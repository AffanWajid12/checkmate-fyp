/*
  Warnings:

  - You are about to drop the column `announcement_id` on the `source_materials` table. All the data in the column will be lost.
  - Added the required column `title` to the `assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assessment_id` to the `source_materials` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'LATE', 'GRADED');

-- DropForeignKey
ALTER TABLE "source_materials" DROP CONSTRAINT "source_materials_announcement_id_fkey";

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "source_materials" DROP COLUMN "announcement_id",
ADD COLUMN     "assessment_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "grade" DOUBLE PRECISION,
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
ADD COLUMN     "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "source_materials" ADD CONSTRAINT "source_materials_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
