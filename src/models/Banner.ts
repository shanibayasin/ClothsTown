import { Schema, model, models } from "mongoose";

const BannerSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
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
      default: "Shop Now",
    },

    buttonLink: {
      type: String,
      default: "/shop",
    },

    image: {
      type: String,
      required: true,
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

export default models.Banner || model("Banner", BannerSchema);