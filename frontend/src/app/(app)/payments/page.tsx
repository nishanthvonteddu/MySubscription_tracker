"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import {
  ArrowRight,
  CreditCard,
  LoaderCircle,
  Search,
  Sparkles,
} from "lucide-react";

import { PaymentMethodForm } from "@/components/payments/payment-method-form";
import { PaymentMethodList } from "@/components/payments/payment-method-list";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  useCreatePaymentMethod,
  useDeletePaymentMethod,
  usePaymentMethods,
  useUpdatePaymentMethod,
} from "@/hooks/use-payment-methods";
import type { PaymentMethod, PaymentMethodUpsertInput } from "@/types";

type Notice = {
  text: string;
  tone: "danger" | "default";
};

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<PaymentMethod | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const deferredSearch = useDeferredValue(search);

  const paymentMethodsQuery = usePaymentMethods();
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod(selectedPaymentMethodId ?? -1);
  const deletePaymentMethod = useDeletePaymentMethod(paymentMethodToDelete?.id ?? -1);

  const paymentMethods = paymentMethodsQuery.data?.items ?? [];
  const selectedPaymentMethod =
    paymentMethods.find((paymentMethod) => paymentMethod.id === selectedPaymentMethodId) ?? null;
  const defaultPaymentMethod =
    paymentMethods.find((paymentMethod) => paymentMethod.is_default) ?? null;
  const providerCount = new Set(
    paymentMethods.map((paymentMethod) => paymentMethod.provider.trim().toLowerCase()),
  ).size;
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredPaymentMethods = paymentMethods
    .filter((paymentMethod) => {
      if (!normalizedSearch) {
        return true;
      }

      return [paymentMethod.label, paymentMethod.provider, paymentMethod.last4 ?? ""].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    })
    .sort(
      (left, right) =>
        Number(right.is_default) - Number(left.is_default) ||
        left.label.localeCompare(right.label),
    );
  const isMutating =
    createPaymentMethod.isPending || updatePaymentMethod.isPending || deletePaymentMethod.isPending;

  const submitLabel = selectedPaymentMethod ? "Save changes" : "Save payment method";
  const formTitle = selectedPaymentMethod ? "Edit payment method" : "Add a payment method";
  const formDescription = selectedPaymentMethod
    ? "Refine the operator label, provider, or default status without leaving the billing workspace."
    : "Add the billing rails that subscriptions can attach to, then keep one marked as the primary default.";

  const handleMutationError = (fallbackMessage: string, error: unknown) => {
    const message = error instanceof Error ? error.message : fallbackMessage;
    setNotice({
      text: message,
      tone: "danger",
    });
  };

  const handleSubmit = async (payload: PaymentMethodUpsertInput) => {
    setNotice(null);

    try {
      if (selectedPaymentMethod) {
        const updatedPaymentMethod = await updatePaymentMethod.mutateAsync(payload);
        setNotice({
          text: `${updatedPaymentMethod.label} updated.`,
          tone: "default",
        });
        setSelectedPaymentMethodId(null);
        return;
      }

      const createdPaymentMethod = await createPaymentMethod.mutateAsync(payload);
      setNotice({
        text: `${createdPaymentMethod.label} saved.`,
        tone: "default",
      });
    } catch (error) {
      handleMutationError("Could not save the payment method.", error);
      throw error;
    }
  };

  const handleMakeDefault = async (paymentMethod: PaymentMethod) => {
    setNotice(null);

    try {
      await updatePaymentMethod.mutateAsync({
        is_default: true,
        label: paymentMethod.label,
        last4: paymentMethod.last4,
        provider: paymentMethod.provider,
      });
      setNotice({
        text: `${paymentMethod.label} is now the default billing rail.`,
        tone: "default",
      });
    } catch (error) {
      handleMutationError("Could not change the default payment method.", error);
    }
  };

  const handleDelete = async () => {
    if (!paymentMethodToDelete) {
      return;
    }

    try {
      await deletePaymentMethod.mutateAsync();
      setNotice({
        text: `${paymentMethodToDelete.label} removed.`,
        tone: "default",
      });
      if (selectedPaymentMethodId === paymentMethodToDelete.id) {
        setSelectedPaymentMethodId(null);
      }
      setPaymentMethodToDelete(null);
    } catch (error) {
      handleMutationError("Could not remove the payment method.", error);
    }
  };

  return (
    <div className="space-y-8 animate-page-enter">
      <PageHeader
        action={
          <Button asChild className="rounded-full px-5" variant="outline">
            <Link href="/subscriptions">
              Review plan assignments
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
        description="Add and tune the billing rails that subscriptions can reuse, keep one method pinned as the default, and tighten the operator catalog without leaving the app shell."
        eyebrow="Day 6 live surface"
        title="Payment methods workspace"
      />

      <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,236,224,0.82))] shadow-line">
        <div className="grid gap-8 p-6 sm:p-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.32em] text-black/45">Billing rail status</p>
            <div className="space-y-3">
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-[2.4rem]">
                {defaultPaymentMethod
                  ? `${defaultPaymentMethod.label} is carrying the default lane.`
                  : paymentMethods.length === 0
                    ? "Start the billing catalog with a primary payment method."
                    : "Choose one default rail so new plan assignments have a clear home."}
              </h2>
              <p className="max-w-2xl text-base leading-7 text-black/64">
                Search the current catalog, swap the default rail in one click, and keep only the
                operator-safe card details needed for subscription assignment.
              </p>
            </div>

            <div className="grid gap-4 pt-3 sm:grid-cols-3">
              <div className="border-t border-black/10 pt-4">
                <p className="text-xs uppercase tracking-[0.28em] text-black/40">Methods</p>
                <p className="mt-2 text-3xl font-semibold text-ink">{paymentMethods.length}</p>
              </div>
              <div className="border-t border-black/10 pt-4">
                <p className="text-xs uppercase tracking-[0.28em] text-black/40">Providers</p>
                <p className="mt-2 text-3xl font-semibold text-ink">{providerCount}</p>
              </div>
              <div className="border-t border-black/10 pt-4">
                <p className="text-xs uppercase tracking-[0.28em] text-black/40">Default rail</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {defaultPaymentMethod ? defaultPaymentMethod.provider : "Unset"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[1.7rem] border border-black/10 bg-white/60 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.32em] text-black/45">Search and focus</p>
            <label className="relative flex items-center">
              <Search className="pointer-events-none absolute left-4 size-4 text-black/38" />
              <input
                className="h-12 w-full rounded-full border border-black/10 bg-white/88 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-black/20 focus:ring-2 focus:ring-ember/15"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search label, provider, or last four"
                type="search"
                value={search}
              />
            </label>

            <div className="space-y-3 text-sm text-black/62">
              <p>
                {filteredPaymentMethods.length} of {paymentMethods.length} payment methods in view.
              </p>
              <p>
                {selectedPaymentMethod
                  ? `Editing ${selectedPaymentMethod.label}.`
                  : "Select any row to refine it, or add a new billing rail on the right."}
              </p>
              {paymentMethods.length > 0 && !defaultPaymentMethod ? (
                <p className="rounded-[1rem] border border-ember/20 bg-ember/8 px-4 py-3 text-ember">
                  No default rail is set. Promote one method so future plan assignments have a
                  clear starting point.
                </p>
              ) : null}
            </div>

            {selectedPaymentMethod ? (
              <Button
                className="rounded-full"
                onClick={() => setSelectedPaymentMethodId(null)}
                type="button"
                variant="outline"
              >
                Clear edit focus
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {notice ? (
        <section
          className={`rounded-[1.7rem] border px-5 py-4 text-sm shadow-line ${
            notice.tone === "danger"
              ? "border-ember/25 bg-ember/8 text-ember"
              : "border-black/10 bg-white/76 text-black/68"
          }`}
        >
          {notice.text}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.9fr)]">
        <div className="space-y-5">
          {paymentMethodsQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center rounded-[2rem] border border-black/10 bg-white/76 shadow-line backdrop-blur">
              <div className="flex items-center gap-3 text-sm text-black/58">
                <LoaderCircle className="size-4 animate-spin" />
                Loading payment methods...
              </div>
            </div>
          ) : filteredPaymentMethods.length === 0 ? (
            <EmptyState
              action={
                search ? (
                  <Button className="rounded-full px-5" onClick={() => setSearch("")} variant="outline">
                    Clear search
                  </Button>
                ) : undefined
              }
              description={
                search
                  ? "No payment methods match this search. Clear the filter or add a new billing rail on the right."
                  : "Add the first billing rail so subscriptions can attach to a saved payment method instead of relying on free-form notes."
              }
              eyebrow={search ? "No search matches" : "Catalog empty"}
              icon={search ? <Sparkles className="size-5" /> : <CreditCard className="size-5" />}
              title={search ? "Nothing matched the current filter." : "No payment methods saved yet."}
            />
          ) : (
            <section className="space-y-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-[0.32em] text-black/45">Saved rails</p>
                <h2 className="text-2xl font-semibold text-ink">
                  Billing methods ready for subscription assignment
                </h2>
                <p className="text-sm leading-6 text-black/62">
                  Default methods stay pinned to the top. Edit a row to refine its label or move
                  the default designation without leaving the page.
                </p>
              </div>

              <PaymentMethodList
                activePaymentMethodId={selectedPaymentMethodId}
                isWorking={isMutating}
                onDelete={setPaymentMethodToDelete}
                onEdit={(paymentMethod) => {
                  setNotice(null);
                  setSelectedPaymentMethodId(paymentMethod.id);
                }}
                onMakeDefault={handleMakeDefault}
                paymentMethods={filteredPaymentMethods}
              />
            </section>
          )}
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <PaymentMethodForm
            description={formDescription}
            disabled={paymentMethodsQuery.isLoading || isMutating}
            errorMessage={notice?.tone === "danger" ? notice.text : null}
            initialPaymentMethod={selectedPaymentMethod}
            onCancel={
              selectedPaymentMethod ? () => setSelectedPaymentMethodId(null) : undefined
            }
            onSubmit={handleSubmit}
            submitLabel={submitLabel}
            title={formTitle}
          />
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Remove payment method"
        description={
          paymentMethodToDelete
            ? `This will remove ${paymentMethodToDelete.label} from the saved catalog and detach it from any linked subscriptions.`
            : ""
        }
        onConfirm={handleDelete}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentMethodToDelete(null);
          }
        }}
        open={Boolean(paymentMethodToDelete)}
        title="Remove this billing rail?"
        tone="danger"
      />
    </div>
  );
}
