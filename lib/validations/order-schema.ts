import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  unitPrice: z.number().positive("Price must be positive"),
  quantity: z
    .number({ invalid_type_error: "Quantity must be a number" })
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(50, "Quantity cannot exceed 50 units per order"),
  lineTotal: z.number().nonnegative(),
});

export const createOrderFormSchema = z.object({
  customerId: z.string({
    required_error: "Please select a customer",
  }).uuid("Please select a valid customer"),
  customerName: z.string().optional(),
  customerEmail: z.string().email("Invalid email").optional(),
  items: z
    .array(orderItemSchema)
    .min(1, "You must select at least one product before placing the order"),
  deliveryNotes: z.string().max(250, "Notes cannot exceed 250 characters").optional(),
  paymentMethod: z.enum(["CREDIT_LINE", "NET_BANKING", "UPI"], {
    required_error: "Select payment method",
  }),
});

export type CreateOrderFormValues = z.infer<typeof createOrderFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid work email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["OPERATOR", "ADMIN", "CUSTOMER"]).default("OPERATOR"),
  rememberMe: z.boolean().default(false),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  organization: z.string().min(2, "Company / Org name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
