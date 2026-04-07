"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  buildPaymentMethodFormValues,
  paymentMethodFormSchema,
  toPaymentMethodPayload,
  type PaymentMethodFormValues,
} from "@/lib/validators";
import type { PaymentMethod, PaymentMethodUpsertInput } from "@/types";

type PaymentMethodFormProps = {
  description: string;
  disabled?: boolean;
  errorMessage?: string | null;
  initialPaymentMethod?: PaymentMethod | null;
  onCancel?: () => void;
  onSubmit: (payload: PaymentMethodUpsertInput) => Promise<void>;
  submitLabel: string;
  title: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-ember">{message}</p>;
}

export function PaymentMethodForm({
  description,
  disabled = false,
  errorMessage,
  initialPaymentMethod,
  onCancel,
  onSubmit,
  submitLabel,
  title,
}: PaymentMethodFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<PaymentMethodFormValues>({
    defaultValues: buildPaymentMethodFormValues(initialPaymentMethod),
    resolver: zodResolver(paymentMethodFormSchema),
  });

  useEffect(() => {
    reset(buildPaymentMethodFormValues(initialPaymentMethod));
  }, [initialPaymentMethod, reset]);

  const isWorking = disabled || isSubmitting;

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-line backdrop-blur sm:p-7">
      <div className="space-y-3 border-b border-black/10 pb-5">
        <p className="text-xs uppercase tracking-[0.32em] text-black/45">
          {initialPaymentMethod ? "Edit rail" : "Add rail"}
        </p>
        <h2 className="text-2xl font-semibold text-ink">{title}</h2>
        <p className="text-sm leading-6 text-black/62">{description}</p>
      </div>

      <form
        className="space-y-6 pt-6"
        onSubmit={handleSubmit(async (values) => {
          try {
            await onSubmit(toPaymentMethodPayload(values));
            if (!initialPaymentMethod) {
              reset(buildPaymentMethodFormValues());
            }
          } catch {
            return;
          }
        })}
      >
        <div className="grid gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="payment-method-label">
              Label
            </label>
            <input
              id="payment-method-label"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/84 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              placeholder="Household Visa"
              {...register("label")}
            />
            <FieldError message={errors.label?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="payment-method-provider">
              Provider
            </label>
            <input
              id="payment-method-provider"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/84 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              placeholder="Visa"
              {...register("provider")}
            />
            <FieldError message={errors.provider?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="payment-method-last4">
              Last four digits
            </label>
            <input
              id="payment-method-last4"
              className="h-12 w-full rounded-[1rem] border border-black/10 bg-white/84 px-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
              inputMode="numeric"
              maxLength={4}
              placeholder="4242"
              {...register("last4")}
            />
            <FieldError message={errors.last4?.message} />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-[1.2rem] border border-black/10 bg-stone/70 px-4 py-4 text-sm text-black/70">
          <input className="mt-1 size-4 rounded border-black/20" type="checkbox" {...register("is_default")} />
          <span>
            <span className="block font-medium text-ink">Set as the default billing rail</span>
            <span className="mt-1 block">
              New subscriptions can point here first, and this method stays visually pinned in the
              workspace.
            </span>
          </span>
        </label>

        {errorMessage ? <FieldError message={errorMessage} /> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-black/52">
            Store only the operator-friendly label, provider, and last four digits needed for plan
            assignment.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            {onCancel ? (
              <Button onClick={onCancel} type="button" variant="outline">
                Cancel
              </Button>
            ) : null}
            <Button className="rounded-full px-6" disabled={isWorking} type="submit">
              {isWorking ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
