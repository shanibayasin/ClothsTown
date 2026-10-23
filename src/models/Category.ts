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

    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    image: {
      type: String,
      default: "",
    },

    bannerImage: {
      type: String,
      default: "",
      trim: true,
    },

    bannerTitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },

    bannerDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    bannerPosition: {
      type: String,
      enum: ["left", "center", "right"],
      default: "left",
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

    menuGroups: {
      type: [
        new Schema(
          {
            title: { type: String, required: true, trim: true },
            categories: {
              type: [
                new Schema(
                  {
                    title: { type: String, required: true, trim: true },
                    category: { type: String, required: true, trim: true },
                  },
                  { _id: false }
                ),
              ],
              default: [],
            },
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

if (!CategoryModel.schema.path("menuGroups")) {
  CategoryModel.schema.add({
    menuGroups: CategorySchema.obj.menuGroups,
  });
}

if (!CategoryModel.schema.path("parentCategory")) {
  CategoryModel.schema.add({
    parentCategory: CategorySchema.obj.parentCategory,
  });
}

for (const path of [
  "bannerImage",
  "bannerTitle",
  "bannerDescription",
  "bannerPosition",
] as const) {
  if (!CategoryModel.schema.path(path)) {
    CategoryModel.schema.add({ [path]: CategorySchema.obj[path] });
  }
}

export default CategoryModel;
