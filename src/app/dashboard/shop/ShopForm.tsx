"use client";

import { useState } from "react";
import { Field, FormMessage, TextArea, useEditForm } from "@/components/forms";
import { ImageField } from "@/components/dashboard/ImageField";
import { shopHost, shopUrl } from "@/config/site";
import type { Shop } from "@/db/schema";
import { NZ_REGIONS, shopSeoDescription, shopSeoTitle } from "@/lib/seo";
import { getTheme, THEMES, themeStyle, type ThemeId } from "@/lib/themes";
import { saveShopAction } from "../actions";

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="panel scroll-mt-6 p-6 sm:p-8" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="text-xl font-bold">
        {title}
      </h2>
      {intro && <p className="mt-1 text-[0.9375rem] text-ink-soft">{intro}</p>}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

export function ShopForm({ shop }: { shop: Shop }) {
  const { state, onSubmit, pending } = useEditForm(saveShopAction);
  const e = state.errors ?? {};

  const [name, setName] = useState(shop.name);
  const [tagline, setTagline] = useState(shop.tagline ?? "");
  const [description, setDescription] = useState(shop.description ?? "");
  const [location, setLocation] = useState(shop.location ?? "");
  const [logo, setLogo] = useState<string | null>(shop.logoUrl);
  const [cover, setCover] = useState<string | null>(shop.coverUrl);
  const [theme, setTheme] = useState<ThemeId>(getTheme(shop.theme).id);
  const [useAccent, setUseAccent] = useState(!!shop.accentColor);
  const [accent, setAccent] = useState(shop.accentColor ?? getTheme(shop.theme).colors.accent);
  const [seoTitle, setSeoTitle] = useState(shop.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(shop.seoDescription ?? "");

  const preview = { name, tagline, description, location, seoTitle, seoDescription };
  const autoTitle = shopSeoTitle({ ...preview, seoTitle: null });
  const autoDescription = shopSeoDescription({ ...preview, seoDescription: null });

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-6">
        <Section id="basics" title="Basics">
          <Field label="Shop name" name="name" value={name} onChange={(ev) => setName(ev.target.value)} error={e.name} maxLength={60} required />
          <Field
            label="Tagline"
            name="tagline"
            value={tagline}
            onChange={(ev) => setTagline(ev.target.value)}
            error={e.tagline}
            maxLength={90}
            placeholder="Raw honey from the Far North"
            hint="One short line under your name. Say what you sell."
          />
          <TextArea
            label="About your shop"
            name="description"
            value={description}
            onChange={(ev) => setDescription(ev.target.value)}
            error={e.description}
            maxLength={1500}
            rows={5}
            placeholder="Who you are, what you make or grow, and what makes it yours."
            hint="Shown on your shop and used by Google. Mention your town and what you sell."
          />
        </Section>

        <Section id="branding" title="Logo and cover photo">
          <ImageField
            label="Logo"
            name="logoUrl"
            kind="logo"
            value={logo}
            onChange={setLogo}
            hint="Square works best. PNG with a transparent background is ideal."
          />
          <ImageField
            label="Cover photo"
            name="coverUrl"
            kind="cover"
            shape="wide"
            value={cover}
            onChange={setCover}
            hint="A wide photo of your stall, shop, workshop or products. Shown across the top of your shop."
          />
        </Section>

        <Section id="design" title="Design" intro="Pick the look that suits what you sell. You can switch any time.">
          <fieldset>
            <legend className="sr-only">Shop design</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.values(THEMES).map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer gap-4 border-[1.5px] p-4 ${
                    theme === t.id ? "border-cobalt bg-cobalt-wash/50" : "border-line hover:border-line-strong"
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={t.id}
                    checked={theme === t.id}
                    onChange={() => {
                      setTheme(t.id);
                      if (!useAccent) setAccent(t.colors.accent);
                    }}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="grid h-14 w-14 shrink-0 place-items-center border"
                    style={{ background: t.colors.bg, borderColor: t.colors.line }}
                  >
                    <span
                      style={{
                        fontFamily: themeStyle(t.id)["--s-heading"],
                        fontStretch: themeStyle(t.id)["--s-heading-stretch"],
                        fontWeight: t.headingWeight,
                        color: t.colors.text,
                        fontSize: 22,
                      }}
                    >
                      Aa
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-bold">
                      {t.name}
                      <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: t.colors.accent }} />
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-soft">{t.suits}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-3 font-medium">
              <input
                type="checkbox"
                name="useAccent"
                checked={useAccent}
                onChange={(ev) => {
                  setUseAccent(ev.target.checked);
                  if (!ev.target.checked) setAccent(getTheme(theme).colors.accent);
                }}
                className="h-4 w-4 accent-cobalt"
              />
              Use my own button colour
            </label>
            {useAccent && (
              <label className="flex items-center gap-2">
                <input
                  type="color"
                  name="accentColor"
                  value={accent}
                  onChange={(ev) => setAccent(ev.target.value)}
                  className="h-10 w-14 cursor-pointer border border-line-strong bg-card p-1"
                />
                <span className="text-sm text-ink-soft">{accent.toUpperCase()}</span>
              </label>
            )}
          </div>
        </Section>

        <Section id="contact" title="Where to find you" intro="Shown on your shop so customers know how to reach you and where to collect.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label="Town or suburb"
              name="location"
              value={location}
              onChange={(ev) => setLocation(ev.target.value)}
              error={e.location}
              maxLength={60}
              placeholder="Kerikeri"
            />
            <div>
              <label htmlFor="region" className="field-label">
                Region
              </label>
              <select id="region" name="region" defaultValue={shop.region ?? ""} className="input">
                <option value="">Choose a region</option>
                {NZ_REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <TextArea
            label="Markets and opening hours"
            name="marketInfo"
            defaultValue={shop.marketInfo ?? ""}
            error={e.marketInfo}
            maxLength={400}
            rows={3}
            placeholder="Saturdays 8am–1pm at the farmers market. Sundays at the harbour craft market."
          />
          <TextArea
            label="Pickup details"
            name="pickupInfo"
            defaultValue={shop.pickupInfo ?? ""}
            error={e.pickupInfo}
            maxLength={300}
            rows={2}
            placeholder="Collect from the stall on market day, or from our workshop by arrangement."
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Field
                label="Contact email"
                name="contactEmail"
                type="email"
                defaultValue={shop.contactEmail ?? ""}
                error={e.contactEmail}
                hint="Enquiries are sent here."
              />
              <label className="mt-3 flex items-center gap-2 text-[0.9375rem]">
                <input type="checkbox" name="showEmail" defaultChecked={shop.showEmail} className="h-4 w-4 accent-cobalt" />
                Show this email on my shop
              </label>
            </div>
            <Field label="Phone (optional)" name="phone" type="tel" defaultValue={shop.phone ?? ""} error={e.phone} maxLength={30} />
            <Field label="Instagram" name="instagram" defaultValue={shop.instagram ?? ""} error={e.instagram} placeholder="@yourshop" />
            <Field label="Facebook" name="facebook" defaultValue={shop.facebook ?? ""} error={e.facebook} placeholder="yourshop" />
            <Field
              label="Other website"
              name="website"
              type="url"
              defaultValue={shop.website ?? ""}
              error={e.website}
              placeholder="https://"
              className="sm:col-span-2"
            />
          </div>
        </Section>

        <Section
          id="seo"
          title="Search engines"
          intro="We write these from your shop details. Fill them in only if you want to say it differently on Google."
        >
          <div className="border border-line bg-card p-4" aria-label="How your shop may appear in Google">
            <p className="text-sm text-ink-soft">{shopHost(shop.subdomain)}</p>
            <p className="mt-0.5 truncate text-lg text-[#1a0dab]">{seoTitle || autoTitle}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{seoDescription || autoDescription}</p>
          </div>
          <Field
            label="Search title"
            name="seoTitle"
            value={seoTitle}
            onChange={(ev) => setSeoTitle(ev.target.value)}
            error={e.seoTitle}
            maxLength={70}
            placeholder={autoTitle}
            hint={`${(seoTitle || autoTitle).length} of about 60 characters`}
          />
          <TextArea
            label="Search description"
            name="seoDescription"
            value={seoDescription}
            onChange={(ev) => setSeoDescription(ev.target.value)}
            error={e.seoDescription}
            maxLength={170}
            rows={3}
            placeholder={autoDescription}
            hint={`${(seoDescription || autoDescription).length} of about 155 characters`}
          />
        </Section>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save shop"}
          </button>
          <div className="min-w-0 flex-1">
            <FormMessage state={state} />
          </div>
        </div>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6">
          <p className="mb-2 text-sm font-semibold">Preview</p>
          <MiniPreview
            name={name}
            tagline={tagline}
            logo={logo}
            cover={cover}
            theme={theme}
            accent={useAccent ? accent : null}
            location={location}
          />
          <a href={shopUrl(shop.subdomain)} className="mt-3 block truncate text-sm text-ink-soft">
            {shopHost(shop.subdomain)}
          </a>
        </div>
      </aside>
    </form>
  );
}

function MiniPreview({
  name,
  tagline,
  logo,
  cover,
  theme,
  accent,
  location,
}: {
  name: string;
  tagline: string;
  logo: string | null;
  cover: string | null;
  theme: ThemeId;
  accent: string | null;
  location: string;
}) {
  const vars = themeStyle(theme, accent) as React.CSSProperties;
  return (
    <div className="storefront overflow-hidden border border-line !min-h-0" style={vars}>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="aspect-[3/1] w-full object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-10 w-10 object-contain" />
          )}
          <div className="min-w-0">
            <p className="s-heading truncate text-lg">{name || "Your shop"}</p>
            {location && <p className="s-muted truncate text-xs">{location}</p>}
          </div>
        </div>
        {tagline && <p className="s-muted mt-3 text-sm">{tagline}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="s-card">
              <div className="aspect-square" style={{ background: "var(--s-line)" }} />
              <div className="p-2">
                <div className="h-2 w-3/4" style={{ background: "var(--s-text)", opacity: 0.7 }} />
                <div className="mt-1.5 h-2 w-1/3" style={{ background: "var(--s-text)" }} />
              </div>
            </div>
          ))}
        </div>
        <span className="s-btn mt-4 w-full !min-h-9 !py-2 text-sm">View product</span>
      </div>
    </div>
  );
}
