"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { PaymentMethodUpsertInput } from "@/types";

const paymentMethodKeys = {
  all: ["payment-methods"] as const,
};

function useRequiredToken() {
  const { accessToken } = useAuth();

  if (!accessToken) {
    throw new Error("You must be signed in to manage payment methods.");
  }

  return accessToken;
}

export function usePaymentMethods() {
  const { accessToken } = useAuth();

  return useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => apiClient.getPaymentMethods(accessToken!),
    queryKey: paymentMethodKeys.all,
  });
}

export function useCreatePaymentMethod() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentMethodUpsertInput) => apiClient.createPaymentMethod(token, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useUpdatePaymentMethod(paymentMethodId: number) {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<PaymentMethodUpsertInput>) =>
      apiClient.updatePaymentMethod(token, paymentMethodId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useDeletePaymentMethod(paymentMethodId: number) {
  const token = useRequiredToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.deletePaymentMethod(token, paymentMethodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}
