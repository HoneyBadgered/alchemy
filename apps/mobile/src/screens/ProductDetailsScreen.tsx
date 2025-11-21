import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function ProductDetailsScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [selectedImage, setSelectedImage] = useState<string | undefined>();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/catalog/products/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      return response.json();
    },
  });

  // Set initial selected image when product loads
  React.useEffect(() => {
    if (product && !selectedImage) {
      setSelectedImage(product.imageUrl || product.images?.[0]);
    }
  }, [product]); // Only depend on product, not selectedImage

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back to Shop</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#9333ea" />
            <Text style={styles.loadingText}>Loading product...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Failed to load product. Please try again later.
            </Text>
          </View>
        )}

        {product && (
          <View style={styles.content}>
            {/* Image Gallery */}
            <View style={styles.imageContainer}>
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderEmoji}>🧪</Text>
                </View>
              )}
            </View>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailScroll}
                contentContainerStyle={styles.thumbnailContent}
              >
                {product.images.map((image: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedImage(image)}
                    style={[
                      styles.thumbnail,
                      selectedImage === image && styles.thumbnailActive,
                    ]}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Product Info */}
            <View style={styles.productInfo}>
              {product.category && (
                <Text style={styles.category}>{product.category}</Text>
              )}
              <Text style={styles.name}>{product.name}</Text>

              <Text style={styles.price}>${product.price}</Text>

              {/* Stock Status */}
              {product.stock > 0 ? (
                <Text style={styles.inStock}>
                  In Stock ({product.stock} available)
                </Text>
              ) : (
                <Text style={styles.outOfStock}>Out of Stock</Text>
              )}

              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{product.description}</Text>
              </View>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Features</Text>
                  <View style={styles.tags}>
                    {product.tags.map((tag: string) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Purchase Options - Fixed at bottom */}
      {product && (
        <View style={styles.purchaseOptions}>
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              product.stock === 0 && styles.buttonDisabled,
            ]}
            disabled={product.stock === 0}
            onPress={() => {
              // TODO: Add to cart functionality
              alert('Add to cart coming soon!');
            }}
          >
            <Text style={styles.addToCartButtonText}>
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.buyNowButton,
              product.stock === 0 && styles.buttonDisabled,
            ]}
            disabled={product.stock === 0}
            onPress={() => {
              // TODO: Buy now functionality
              alert('Buy now coming soon!');
            }}
          >
            <Text style={styles.buyNowButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d1fae5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#9333ea',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#581c87',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  errorText: {
    color: '#991b1b',
  },
  content: {
    backgroundColor: '#fff',
    marginBottom: 120,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 120,
  },
  thumbnailScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  thumbnailContent: {
    padding: 16,
    gap: 8,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    marginRight: 8,
  },
  thumbnailActive: {
    borderColor: '#9333ea',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 16,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#581c87',
    marginBottom: 16,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#9333ea',
    marginBottom: 12,
  },
  inStock: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 24,
  },
  outOfStock: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  purchaseOptions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  addToCartButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buyNowButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#9333ea',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyNowButtonText: {
    color: '#9333ea',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
    borderColor: '#d1d5db',
  },
});
