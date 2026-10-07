"use client";

import Link from "next/link";
import { useState } from "react";
import { PhotoManager, type Photo } from "@/components/dashboard/PhotoManager";
import { Field, FormMessage, TextArea, useEditForm } from "@/components/forms";
import type { Listing } from "@/db/schema";
import { centsToInput, formatPrice, parsePrice } from "@/lib/format";
import { listingSeoDescription, listingSeoTitle } from "@/lib/seo";
import { saveListingAction } from "./actions";

type Props = {
  listing?: Listing & { images: Photo[] };
  shop: { name: string; location: string | null };
  categories: string[];
};

const STATUS_OPTIONS = [
  { value: "active", label: "For sale", hint: "Shown in your shop" },
  { value: "draft", label: "Draft", hint: "Only you can see it" },
  { value: "sold", label: "Sold", hint: "Shown as sold" },
  { value: "hidden", label: "Hidden", hint: "Out of season or paused" },
];

export function ListingForm({ listing, shop, categories }: Props) {
  const { state, onSubmit, pending } = useEditForm(saveListingAction);
  const e = state.errors ?? {};

  const [title, setTitle] = useState(listing?.title ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [price, setPrice] = useState(centsToInput(listing?.priceCents));
  const [delivery, setDelivery] = useState(listing ? (listing.shippingCents === null ? "pickup" : "ship") : "ship");
  const [stock, setStock] = useState(
    !listing ? "one" : listing.quantity === null ? "unlimited" : listing.quantity === 1 ? "one" : "count",
  );
  const [status, setStatus] = useState<string>(listing?.status ?? "active");
  const [uploading, setUploading] = useState(false);

  const priceCents = parsePrice(price) ?? 0;
  const autoTitle = listingSeoTitle({ title: title || "Your product", priceCents, seoTitle: null }, shop);
  const autoDescription = listingSeoDescription({ title: title || "Your product", description, seoDescription: null }, shop);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {listing && <input type="hidden" name="id" value={listing.id} />}

      <section className="panel p-6 sm:p-8">
        <h2 className="mb-5 text-xl font-bold">Photos</h2>
        <PhotoManager initial={listing?.images ?? []} onUploadingChange={setUploading} />
      </section>

      <section className="panel space-y-6 p-6 sm:p-8">
        <h2 className="text-xl font-bold">Details</h2>
        <Field
          label="Product name"
          name="title"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          error={e.title}
          maxLength={120}
          placeholder="Speckled stoneware mug, 350ml"
          hint="Say what it is, the way a customer would search for it."
          required
        />
        <TextArea
          label="Description"
          name="description"
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
          error={e.description}
          rows={6}
          maxLength={4000}
          placeholder="Size, materials or ingredients, how to care for it, and anything that makes it special."
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Category (optional)"
            name="category"
            defaultValue={listing?.category ?? ""}
            error={e.category}
            list="category-options"
            maxLength={40}
            placeholder="Mugs"
            hint="Groups products in your shop."
          />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </section>

      <section className="panel space-y-6 p-6 sm:p-8">
        <h2 className="text-xl font-bold">Price and delivery</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Price (NZD)"
            name="price"
            inputMode="decimal"
            value={price}
            onChange={(ev) => setPrice(ev.target.value)}
            error={e.price}
            placeholder="24.00"
            required
          />
        </div>

        <fieldset>
          <legend className="field-label">How customers get it</legend>
          <div className="mt-1 grid gap-3 sm:grid-cols-2">
            {[
              { v: "ship", t: "Post or courier it", d: "Set a shipping price for this item" },
              { v: "pickup", t: "Pickup only", d: "Collected from your stall, shop or home" },
            ].map((o) => (
              <label
                key={o.v}
                className={`flex cursor-pointer items-start gap-3 border-[1.5px] p-4 ${delivery === o.v ? "border-cobalt bg-cobalt-wash/50" : "border-line"}`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={o.v}
                  checked={delivery === o.v}
                  onChange={() => setDelivery(o.v)}
                  className="mt-1 h-4 w-4 accent-cobalt"
                />
                <span>
                  <span className="block font-semibold">{o.t}</span>
                  <span className="block text-sm text-ink-soft">{o.d}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {delivery === "ship" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label="Shipping price (NZD)"
              name="shipping"
              inputMode="decimal"
              defaultValue={centsToInput(listing?.shippingCents ?? null)}
              error={e.shipping}
              placeholder="8.50"
              hint={
                <>
                  Use 0 for free shipping.{" "}
                  <Link href="/guides/setting-shipping-prices-nz" target="_blank" className="underline">
                    How to work it out
                  </Link>
                </>
              }
              required
            />
            <label className="flex items-center gap-3 self-center pt-4 font-medium">
              <input type="checkbox" name="pickup" defaultChecked={listing?.pickup ?? true} className="h-4 w-4 accent-cobalt" />
              Pickup also available
            </label>
          </div>
        )}

        <fieldset>
          <legend className="field-label">How many do you have?</legend>
          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-3">
            {[
              { v: "one", t: "Just one (one-off piece)" },
              { v: "count", t: "A set number" },
              { v: "unlimited", t: "Made to order / plenty" },
            ].map((o) => (
              <label key={o.v} className="flex items-center gap-2">
                <input type="radio" name="stock" value={o.v} checked={stock === o.v} onChange={() => setStock(o.v)} className="h-4 w-4 accent-cobalt" />
                {o.t}
              </label>
            ))}
          </div>
          {stock === "count" && (
            <div className="mt-4 max-w-[12rem]">
              <Field
                label="Quantity"
                name="quantity"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                defaultValue={listing?.quantity && listing.quantity > 1 ? String(listing.quantity) : "5"}
                error={e.quantity}
              />
            </div>
          )}
        </fieldset>
      </section>

      <section className="panel p-6 sm:p-8">
        <h2 className="text-xl font-bold">Visibility</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {STATUS_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`cursor-pointer border-[1.5px] p-3 ${status === o.value ? "border-cobalt bg-cobalt-wash/50" : "border-line"}`}
            >
              <input
                type="radio"
                name="status"
                value={o.value}
                checked={status === o.value}
                onChange={() => setStatus(o.value)}
                className="sr-only"
              />
              <span className="block font-semibold">{o.label}</span>
              <span className="block text-sm text-ink-soft">{o.hint}</span>
            </label>
          ))}
        </div>
      </section>

      <details className="panel p-6 sm:p-8">
        <summary className="cursor-pointer text-xl font-bold">Search engines (optional)</summary>
        <div className="mt-6 space-y-6">
          <div className="border border-line bg-card p-4">
            <p className="truncate text-lg text-[#1a0dab]">{autoTitle}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{autoDescription}</p>
          </div>
          <Field label="Search title" name="seoTitle" defaultValue={listing?.seoTitle ?? ""} error={e.seoTitle} maxLength={70} placeholder={autoTitle} />
          <TextArea
            label="Search description"
            name="seoDescription"
            defaultValue={listing?.seoDescription ?? ""}
            error={e.seoDescription}
            maxLength={170}
            rows={3}
            placeholder={autoDescription}
          />
        </div>
      </details>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <button type="submit" className="btn btn-primary" disabled={pending || uploading}>
          {uploading ? "Waiting for photos…" : pending ? "Saving…" : listing ? "Save product" : "Add product"}
        </button>
        {priceCents > 0 && (
          <span className="text-sm text-ink-soft">
            Shown as <strong className="text-ink">{formatPrice(priceCents)}</strong>
          </span>
        )}
        <div className="min-w-0 flex-1">
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
