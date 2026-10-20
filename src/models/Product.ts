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
      required: true,
    },

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

    newArrival: {
      type: Boolean,
      default: false,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default models.Product || model("Product", ProductSchema);