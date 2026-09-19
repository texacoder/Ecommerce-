-- CreateTable
CREATE TABLE "ProductOptionLink" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "optionProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductOptionLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductOptionLink_productId_optionProductId_key" ON "ProductOptionLink"("productId", "optionProductId");

-- AddForeignKey
ALTER TABLE "ProductOptionLink" ADD CONSTRAINT "ProductOptionLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOptionLink" ADD CONSTRAINT "ProductOptionLink_optionProductId_fkey" FOREIGN KEY ("optionProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
