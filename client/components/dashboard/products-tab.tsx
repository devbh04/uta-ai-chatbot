"use client";

import React, { useState, useEffect } from "react";
import { Package, Search, PlusCircle, Trash2, Edit, RefreshCw, X, Loader2, Tag } from "lucide-react";
import { API_URL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface Product {
  product_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url?: string;
  in_stock: boolean;
  tags: string[];
}

const UNSPLASH_IMAGES: Record<string, string[]> = {
  jackets: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600",
    "https://images.unsplash.com/photo-1508454972847-7f61b0597305?q=80&w=600"
  ],
  footwear: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=600"
  ],
  backpacks: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600",
    "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=600"
  ],
  camping: [
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600",
    "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?q=80&w=600"
  ],
  general: [
    "https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=600",
    "https://images.unsplash.com/photo-1478860409698-8707f313ee8b?q=80&w=600",
    "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=600"
  ]
};

function getRandomImage(category: string): string {
  const normCategory = category.toLowerCase();
  let list = UNSPLASH_IMAGES[normCategory];
  if (!list || list.length === 0) {
    list = UNSPLASH_IMAGES.general;
  }
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Create Product Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCategory, setProdCategory] = useState("jackets");
  const [prodPrice, setProdPrice] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodInStock, setProdInStock] = useState(true);
  const [prodTags, setProdTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Product Dialog state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch product catalog from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Delete
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product from database and vector indexes?")) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product.");
    }
  };

  // Handle Create Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // If image URL is blank, assign a random high-quality Unsplash adventure image
    const finalImageUrl = prodImageUrl.trim() || getRandomImage(prodCategory);
    const tagsArray = prodTags.split(",").map((t) => t.trim()).filter((t) => t !== "");

    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prodName,
          description: prodDesc,
          category: prodCategory,
          price: parseFloat(prodPrice) || 0,
          image_url: finalImageUrl,
          in_stock: prodInStock,
          tags: tagsArray
        })
      });

      if (!res.ok) throw new Error("Create failed");
      setIsCreateOpen(false);
      // Reset fields
      setProdName("");
      setProdDesc("");
      setProdCategory("jackets");
      setProdPrice("");
      setProdImageUrl("");
      setProdInStock(true);
      setProdTags("");
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to save product to server database.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/products/${editingProduct.product_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingProduct.name,
          description: editingProduct.description,
          category: editingProduct.category,
          price: editingProduct.price,
          image_url: editingProduct.image_url,
          in_stock: editingProduct.in_stock,
          tags: editingProduct.tags
        })
      });

      if (!res.ok) throw new Error("Update failed");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to update product details.");
    } finally {
      setSubmitting(false);
    }
  };

  // Extract unique categories for filter dropdown
  const categoriesList = Array.from(new Set(products.map((p) => p.category)));

  // Client-side search and filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Head */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Product Catalog Operations</h2>
          <p className="text-xs text-muted-foreground">Manage product listings and update vector database indexes.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="text-xs h-8">
          <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add Product
        </Button>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-border p-3 rounded-lg shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search catalog by keyword or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs h-8.5 bg-secondary/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-secondary/20 hover:bg-secondary/40 border border-border text-xs rounded-md h-8.5 px-2.5 text-foreground outline-hidden"
          >
            <option value="ALL">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchProducts}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      {loading && products.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white border border-border rounded-lg p-12 text-center text-muted-foreground text-xs">
              No products found.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.product_id} className="bg-white border border-border shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Image banner */}
                  <div className="h-36 bg-secondary/30 relative">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <Badge variant={product.in_stock ? "success" : "danger"} className="absolute top-2 right-2 text-[9px] font-bold">
                      {product.in_stock ? "In Stock" : "Out of Stock"}
                    </Badge>
                    <Badge className="absolute top-2 left-2 text-[8px] bg-black/60 border-0 font-medium">
                      {product.category}
                    </Badge>
                  </div>

                  <CardContent className="p-3.5 space-y-2 text-xs">
                    <div>
                      <span className="text-[9px] font-mono text-muted-foreground block">{product.product_id}</span>
                      <h4 className="font-bold text-foreground leading-snug line-clamp-1">{product.name}</h4>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">{product.description}</p>

                    <div className="flex justify-between items-center pt-1">
                      <span className="font-bold font-mono text-primary text-sm">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.price)}
                      </span>
                    </div>

                    {/* Tags list */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5 border-t border-border/40">
                        {product.tags.map((tg) => (
                          <span key={tg} className="inline-flex items-center gap-0.5 text-[8.5px] bg-secondary text-muted-foreground font-semibold px-1.5 py-0.5 rounded-sm">
                            <Tag className="h-2 w-2" />
                            {tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </div>
                <CardFooter className="p-2 border-t border-border/40 bg-secondary/5 flex justify-end gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingProduct(product)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDeleteProduct(product.product_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* --- ADD PRODUCT MODAL DIALOG --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg border border-border shadow-lg max-w-md w-full">
            <header className="p-4 border-b border-border flex justify-between items-center bg-secondary/15">
              <h3 className="font-bold text-sm text-foreground">Catalog New Product</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsCreateOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </header>
            <form onSubmit={handleCreateProduct} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Product Name</label>
                  <Input
                    required
                    placeholder="e.g. Hiking Jacket"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="h-8.5 bg-secondary/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-secondary/10 hover:bg-secondary/20 border border-border text-xs rounded-md h-8.5 px-2.5 text-foreground outline-hidden"
                  >
                    <option value="jackets">Jackets</option>
                    <option value="footwear">Footwear</option>
                    <option value="backpacks">Backpacks</option>
                    <option value="camping">Camping</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Price ($)</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 129.99"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="h-8.5 bg-secondary/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground block">Stock Availability</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="stock"
                        checked={prodInStock}
                        onChange={() => setProdInStock(true)}
                        className="accent-primary"
                      />
                      <span>In Stock</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="stock"
                        checked={!prodInStock}
                        onChange={() => setProdInStock(false)}
                        className="accent-primary"
                      />
                      <span>Out of Stock</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Summarize product features..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full rounded-md border border-input bg-secondary/10 px-3 py-1.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Product Tags (comma-separated)</label>
                <Input
                  placeholder="e.g. insulated, winter, warm"
                  value={prodTags}
                  onChange={(e) => setProdTags(e.target.value)}
                  className="h-8.5 bg-secondary/10"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Image URL (Optional)</label>
                <Input
                  placeholder="Leave blank for automatic Unsplash adventure match"
                  value={prodImageUrl}
                  onChange={(e) => setProdImageUrl(e.target.value)}
                  className="h-8.5 bg-secondary/10"
                />
              </div>

              <footer className="border-t border-border/50 pt-3 flex justify-end gap-2 shrink-0">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Processing..." : "Save Product"}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL DIALOG --- */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg border border-border shadow-lg max-w-md w-full">
            <header className="p-4 border-b border-border flex justify-between items-center bg-secondary/15">
              <div>
                <h3 className="font-bold text-sm text-foreground">Edit Product Details</h3>
                <span className="text-[10px] text-muted-foreground font-mono">{editingProduct.product_id}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingProduct(null)}>
                <X className="h-4 w-4" />
              </Button>
            </header>
            <form onSubmit={handleUpdateProduct} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Product Name</label>
                  <Input
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="h-8.5 bg-secondary/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-secondary/10 hover:bg-secondary/20 border border-border text-xs rounded-md h-8.5 px-2.5 text-foreground outline-hidden"
                  >
                    <option value="jackets">Jackets</option>
                    <option value="footwear">Footwear</option>
                    <option value="backpacks">Backpacks</option>
                    <option value="camping">Camping</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Price ($)</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="h-8.5 bg-secondary/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground block">Stock Availability</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-stock"
                        checked={editingProduct.in_stock}
                        onChange={() => setEditingProduct({ ...editingProduct, in_stock: true })}
                        className="accent-primary"
                      />
                      <span>In Stock</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-stock"
                        checked={!editingProduct.in_stock}
                        onChange={() => setEditingProduct({ ...editingProduct, in_stock: false })}
                        className="accent-primary"
                      />
                      <span>Out of Stock</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Description</label>
                <textarea
                  required
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full rounded-md border border-input bg-secondary/10 px-3 py-1.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Product Tags (comma-separated)</label>
                <Input
                  value={editingProduct.tags.join(", ")}
                  onChange={(e) => setEditingProduct({
                    ...editingProduct,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter((t) => t !== "")
                  })}
                  className="h-8.5 bg-secondary/10"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Image URL</label>
                <Input
                  value={editingProduct.image_url || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  className="h-8.5 bg-secondary/10"
                />
              </div>

              <footer className="border-t border-border/50 pt-3 flex justify-end gap-2 shrink-0">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Updating..." : "Update Details"}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
