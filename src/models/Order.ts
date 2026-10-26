import { Schema, models, model } from "mongoose";

const OrderSchema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    postalCode: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      required: true,
    },

    paymentMethod: {
      type: String,
      default: "Cash On Delivery",
    },

    products: [
      {
        productId: String,

        name: String,

        image: String,

        size: String,

        color: String,

        quantity: Number,

        price: Number,
      },
    ],

    total: Number,

    inventoryReserved: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

export default models.Order ||
  model("Order", OrderSchema);