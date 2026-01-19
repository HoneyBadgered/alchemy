/*
  Warnings:

  - A unique constraint covering the columns `[ingredientKey,role]` on the table `ingredients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ingredients_ingredientKey_role_key" ON "ingredients"("ingredientKey", "role");
