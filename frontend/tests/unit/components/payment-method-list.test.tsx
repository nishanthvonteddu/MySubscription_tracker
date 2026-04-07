import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PaymentMethodList } from "@/components/payments/payment-method-list";
import type { PaymentMethod } from "@/types";

const paymentMethods: PaymentMethod[] = [
  {
    created_at: "2026-04-07T00:00:00Z",
    id: 2,
    is_default: true,
    label: "Household Visa",
    last4: "4242",
    provider: "Visa",
    updated_at: "2026-04-07T00:00:00Z",
    user_id: 1,
  },
  {
    created_at: "2026-04-06T00:00:00Z",
    id: 4,
    is_default: false,
    label: "Travel Card",
    last4: null,
    provider: "Mastercard",
    updated_at: "2026-04-06T00:00:00Z",
    user_id: 1,
  },
];

describe("PaymentMethodList", () => {
  it("renders saved rails and highlights the default method", () => {
    render(
      <PaymentMethodList
        activePaymentMethodId={2}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onMakeDefault={vi.fn()}
        paymentMethods={paymentMethods}
      />,
    );

    expect(screen.getByText("Household Visa")).toBeVisible();
    expect(screen.getByText("Default")).toBeVisible();
    expect(screen.getByText("•••• 4242")).toBeVisible();
    expect(screen.getByText("No last four saved")).toBeVisible();
  });

  it("routes row actions to the provided handlers", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    const onMakeDefault = vi.fn();

    render(
      <PaymentMethodList
        onDelete={onDelete}
        onEdit={onEdit}
        onMakeDefault={onMakeDefault}
        paymentMethods={paymentMethods}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    await user.click(screen.getByRole("button", { name: /make default/i }));
    await user.click(screen.getAllByRole("button", { name: /remove/i })[1]);

    expect(onEdit).toHaveBeenCalledWith(paymentMethods[0]);
    expect(onMakeDefault).toHaveBeenCalledWith(paymentMethods[1]);
    expect(onDelete).toHaveBeenCalledWith(paymentMethods[1]);
  });
});
