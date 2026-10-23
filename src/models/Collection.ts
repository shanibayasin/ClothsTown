import { Schema, model, models } from "mongoose";

const CollectionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    subtitle: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    buttonText: {
      type: String,
      default: "Shop Collection",
    },

    buttonLink: {
      type: String,
      default: "/shop",
    },

    image: {
      type: String,
      default: "",
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

export default models.Collection ||
  model("Collection", CollectionSchema);