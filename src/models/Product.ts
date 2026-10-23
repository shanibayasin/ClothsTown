import mongoose, { Schema, models, model } from "mongoose";

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    shortDescription: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    season: {
      type: String,
      default: "",
      trim: true,
    },

    fabric: {
      type: String,
      default: "",
      trim: true,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    productType: {
      type: String,
      default: "",
      trim: true,
    },

    fragranceType: {
      type: String,
      default: "",
      trim: true,
    },

    bottleSize: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

    stock: {
      type: Number,
      default: 0,
    },

    sku: {
      type: String,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
    },

    collections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collection",
      },
    ],

    images: [
      {
        type: String,
      },
    ],

    sizes: [
      {
        type: String,
      },
    ],

    colors: [
      {
        type: String,
      },
    ],

    featured: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    onSale: {
      type: Boolean,
    },

    newArrival: {
      type: Boolean,
      default: false,
    },

    isNewArrival: {
      type: Boolean,
      default: false,
    },

    status: {
      type: Boolean,
      default: true,
    },

    publicationStatus: {
      type: String,
      enum: ["active", "draft", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProductModel = models.Product || model("Product", ProductSchema);

if (!ProductModel.schema.path("season")) {
  ProductModel.schema.add({
    season: ProductSchema.obj.season,
    fabric: ProductSchema.obj.fabric,
  });
}

for (const field of ["brand", "productType", "fragranceType", "bottleSize"] as const) {
  if (!ProductModel.schema.path(field)) {
    ProductModel.schema.add({ [field]: ProductSchema.obj[field] });
  }
}

if (!ProductModel.schema.path("collections")) {
  ProductModel.schema.add({
    collections: ProductSchema.obj.collections,
  });
}

if (!ProductModel.schema.path("onSale")) {
  ProductModel.schema.add({
    onSale: ProductSchema.obj.onSale,
  });
}

if (!ProductModel.schema.path("isFeatured")) {
  ProductModel.schema.add({
    isFeatured: ProductSchema.obj.isFeatured,
  });
}

if (!ProductModel.schema.path("isNewArrival")) {
  ProductModel.schema.add({
    isNewArrival: ProductSchema.obj.isNewArrival,
  });
}

if (!ProductModel.schema.path("publicationStatus")) {
  ProductModel.schema.add({
    publicationStatus: ProductSchema.obj.publicationStatus,
  });
}

export default ProductModel;