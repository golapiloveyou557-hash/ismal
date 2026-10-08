export const paymentConfig = {
  beneficiaryName: "MD EJAN CHOWDHURY",
  methods: [
    {
      key: "bkash",
      label: "bKash",
      account: "01863211541",
      type: "Mobile payment",
    },
    {
      key: "nagad",
      label: "Nagad",
      account: "01863211541",
      type: "Mobile payment",
    },
    {
      key: "bank",
      label: "MyBank",
      account: "514012122490",
      type: "Bank transfer",
    },
  ],
  withdrawEnabled: false,
} as const;

export type PaymentMethodKey = (typeof paymentConfig.methods)[number]["key"];
