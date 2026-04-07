"use client";

import { CheckCircle2, PencilLine, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

type PaymentMethodListProps = {
  activePaymentMethodId?: number | null;
  isWorking?: boolean;
  onDelete: (paymentMethod: PaymentMethod) => void;
  onEdit: (paymentMethod: PaymentMethod) => void;
  onMakeDefault: (paymentMethod: PaymentMethod) => void;
  paymentMethods: PaymentMethod[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function PaymentMethodList({
  activePaymentMethodId,
  isWorking = false,
  onDelete,
  onEdit,
  onMakeDefault,
  paymentMethods,
}: PaymentMethodListProps) {
  return (
    <div className="space-y-3">
      {paymentMethods.map((paymentMethod, index) => {
        const isActive = paymentMethod.id === activePaymentMethodId;

        return (
          <article
            className={cn(
              "animate-page-enter-delayed overflow-hidden rounded-[1.7rem] border bg-white/78 shadow-line backdrop-blur transition",
              isActive
                ? "border-[#111922]/18 ring-2 ring-ember/20"
                : "border-black/10 hover:border-black/16",
            )}
            key={paymentMethod.id}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex flex-col gap-5 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-ink">{paymentMethod.label}</h3>
                    {paymentMethod.is_default ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#101922] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-white">
                        <ShieldCheck className="size-3.5" />
                        Default
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-black/62">
                    <span>{paymentMethod.provider}</span>
                    <span>{paymentMethod.last4 ? `•••• ${paymentMethod.last4}` : "No last four saved"}</span>
                    <span>Updated {formatDate(paymentMethod.updated_at)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    className="rounded-full"
                    onClick={() => onEdit(paymentMethod)}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                  >
                    <PencilLine className="mr-2 size-4" />
                    Edit
                  </Button>
                  {!paymentMethod.is_default ? (
                    <Button
                      className="rounded-full"
                      disabled={isWorking}
                      onClick={() => onMakeDefault(paymentMethod)}
                      type="button"
                      variant="ghost"
                    >
                      <CheckCircle2 className="mr-2 size-4" />
                      Make default
                    </Button>
                  ) : null}
                  <Button
                    className="rounded-full text-ember hover:bg-ember/10 hover:text-ember"
                    disabled={isWorking}
                    onClick={() => onDelete(paymentMethod)}
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
