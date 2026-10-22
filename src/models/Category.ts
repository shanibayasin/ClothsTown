import { Schema, model, models } from "mongoose";

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    image: {
      type: String,
      default: "",
    },

    sectionTiles: {
      type: [
        new Schema(
          {
            title: { type: String, required: true, trim: true },
            image: { type: String, required: true },
            category: { type: String, default: "", trim: true },
          },
          { _id: false }
        ),
      ],
      default: [],
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

const CategoryModel = models.Category || model("Category", CategorySchema);

if (!CategoryModel.schema.path("sectionTiles")) {
  CategoryModel.schema.add({
    sectionTiles: CategorySchema.obj.sectionTiles,
  });
}

export default CategoryModel;
