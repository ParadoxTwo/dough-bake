'use client'

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProductWithDetails, getProductById } from "@/lib/actions/product";
import { getCurrentUserProfile } from "@/lib/actions/user";
import { Product } from "@/lib/types/product";
import { ProductWithVariants } from "@/lib/types/variant";
import { addToCart, CartItem } from "@/lib/utils/cart";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ProductImage from "@/components/product/ProductImage";
import ProductInfo from "@/components/product/ProductInfo";
import EditableProductInfo from "@/components/admin/EditableProductInfo";
import EditableImageGallery from "@/components/admin/EditableImageGallery";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductWithVariants | Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id || typeof params.id !== 'string') {
        router.push("/menu");
        return;
      }

      // Check if user is admin
      const profile = await getCurrentUserProfile();
      const admin = profile?.isAdmin || false;
      setIsAdmin(admin);

      // Always fetch product with details (including images) for carousel display
      const data = await getProductWithDetails(params.id);

      if (!data) {
        router.push("/menu");
        return;
      }

      setProduct(data);
      setLoading(false);
    };

    fetchData();
  }, [params.id, router]);

  const handleAddToCart = () => {
    if (!product) return;

    setAddingToCart(true);

    // ProductWithVariants extends Product, so it has all Product properties
    const baseProduct = product as Product;
    const productWithDetails = 'images' in product ? product as ProductWithVariants : null;
    const selectedVariant = productWithDetails?.variants?.find(v => v.id === selectedVariantId) || null;
    
    const finalPrice = selectedVariant
      ? baseProduct.price + selectedVariant.price_adjustment
      : baseProduct.price;
    
    const itemName = selectedVariant
      ? `${baseProduct.name} - ${selectedVariant.name}`
      : baseProduct.name;
    
    // Get thumbnail image - prefer variant image, fallback to product image
    let thumbnailUrl: string | null = null;
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      thumbnailUrl = selectedVariant.images[0].thumbnail_url;
    } else if (productWithDetails?.images && productWithDetails.images.length > 0) {
      thumbnailUrl = productWithDetails.images[0].thumbnail_url;
    }
    
    const cartItem: CartItem = {
      id: selectedVariant ? `${baseProduct.id}-${selectedVariant.id}` : baseProduct.id,
      name: itemName,
      price: finalPrice,
      quantity: quantity,
      imageUrl: thumbnailUrl,
    };

    addToCart(cartItem);

    // Show success message and redirect
    alert("Added to cart!");
    setAddingToCart(false);
    router.push("/cart");
  };

  const handleImageUpdate = async () => {
    // Refresh product data after image update
    if (!params.id || typeof params.id !== 'string') return;
    const data = await getProductWithDetails(params.id);
    if (data) {
      setProduct(data);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton variant="product" />
      </PageContainer>
    );
  }

  if (!product) {
    return null;
  }

  const baseProduct = product as Product;
  const productWithDetails = 'images' in product ? product as ProductWithVariants : null;
  
  // Get selected variant and its images
  const selectedVariant = productWithDetails?.variants?.find(v => v.id === selectedVariantId) || null;
  const displayImages = selectedVariant?.images && selectedVariant.images.length > 0
    ? selectedVariant.images
    : productWithDetails?.images || [];

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: '← Back to Menu', href: '/menu' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductImage 
          product={baseProduct} 
          images={displayImages}
          size="large"
          isAdmin={isAdmin}
          productId={baseProduct.id}
          variantId={selectedVariantId}
          onImageUpdate={handleImageUpdate}
        />
        
        {isAdmin && productWithDetails ? (
          <EditableProductInfo
            product={productWithDetails}
            selectedVariantId={selectedVariantId}
            onVariantSelect={setSelectedVariantId}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
            addingToCart={addingToCart}
          />
        ) : (
          <ProductInfo
            product={baseProduct}
            productWithDetails={productWithDetails}
            selectedVariantId={selectedVariantId}
            onVariantSelect={setSelectedVariantId}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
            addingToCart={addingToCart}
          />
        )}
      </div>
    </PageContainer>
  );
}
