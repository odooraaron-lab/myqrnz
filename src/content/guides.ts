/**
 * Long-form guides for search. Each answers a question market stall holders and
 * small shop owners actually type into Google. Links use [text](/path) markup.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "tip"; text: string };

export type Guide = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  keywords: string[];
  published: string;
  updated: string;
  readMinutes: number;
  intro: string;
  body: Block[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-start-an-online-store-nz",
    title: "How to start an online store in New Zealand (without monthly fees)",
    shortTitle: "Start an online store in NZ",
    description:
      "A plain-English guide to setting up an online shop in NZ: choosing a name, listing products, taking payment, shipping and the rules small sellers should know.",
    keywords: ["start an online store nz", "online shop nz", "sell online new zealand", "online store no monthly fees", "set up online shop"],
    published: "2026-10-08",
    updated: "2026-10-08",
    readMinutes: 7,
    intro:
      "You don't need a web designer, a big budget or a monthly subscription to sell online in New Zealand. If you already sell at a market, from a small shop or from home, most of the hard work is done: you have products, prices and customers. This guide walks through the rest.",
    body: [
      { type: "h2", text: "1. Decide what your online store is for" },
      {
        type: "p",
        text: "Before picking any tools, be clear about the job. For most small sellers an online store does three things: it lets people who met you in person buy again later, it shows your full range when you can't fit everything on the table, and it gives you somewhere to send people who ask \"do you have a website?\".",
      },
      {
        type: "p",
        text: "That's a smaller job than a big e-commerce site, and it means you can start simple. You can always add more later.",
      },
      { type: "h2", text: "2. Choose a name people can type and remember" },
      {
        type: "p",
        text: "Your shop name becomes your web address. Short, plain names work best because people will type them from memory or read them off a sign. Avoid unusual spellings and numbers that could be mistaken for letters.",
      },
      {
        type: "ul",
        items: [
          "Use the name customers already know you by — the one on your banner or your business card.",
          "Hyphens are fine between words (totara-honey) and easier to read than everything joined up.",
          "Say it out loud. If you'd need to spell it for someone, it might be too complicated.",
        ],
      },
      {
        type: "p",
        text: "On myQR your name becomes your address, like totara-honey.myqr.co.nz, and you can [check if your name is free](/register) in a few seconds.",
      },
      { type: "h2", text: "3. Work out what it will really cost" },
      {
        type: "p",
        text: "Online store builders charge in three ways: a monthly subscription, a fee on each sale, or a one-off setup fee. Add up a full year, not just the first month. A $30 monthly plan is $360 a year whether you sell anything or not — that's a lot of jars of honey.",
      },
      {
        type: "p",
        text: "If your sales are seasonal or you only trade at weekends, a model with no monthly fee usually works out cheaper. You pay when you sell. See [how myQR pricing works](/pricing).",
      },
      { type: "h2", text: "4. List your first ten products" },
      {
        type: "p",
        text: "Don't wait until you've photographed everything. Start with your ten best sellers — the things people ask about most at the stall. Each listing needs:",
      },
      {
        type: "ul",
        items: [
          "A clear photo, taken in daylight against a plain background (see our [phone photo guide](/guides/product-photos-with-your-phone)).",
          "A name that says what it is: \"Manuka honey, 500g\" beats \"Golden Treasure\".",
          "A price, and a shipping price if you'll post it.",
          "Two or three sentences covering size, materials or ingredients, and how to care for it.",
        ],
      },
      { type: "h2", text: "5. Sort out delivery and pickup" },
      {
        type: "p",
        text: "Decide which items you'll post and which are pickup only. Heavy, fragile or perishable products are often better as pickup from your stall or shop. For everything else, weigh a packed item and check courier rates before you set a shipping price. Our guide to [setting shipping prices in NZ](/guides/setting-shipping-prices-nz) covers this in detail.",
      },
      { type: "h2", text: "6. Know the basic rules" },
      {
        type: "p",
        text: "Selling online in New Zealand is straightforward, but a few rules apply to everyone in trade:",
      },
      {
        type: "ul",
        items: [
          "The Consumer Guarantees Act and Fair Trading Act apply online just as they do at a market. Describe products honestly and make it clear you're selling as a business.",
          "If you sell food, check your food safety obligations with your local council or MPI before listing it online.",
          "You must register for GST once your turnover goes over $60,000 in 12 months. Below that it's optional. Inland Revenue's website explains the details.",
          "Keep records of every sale. Your myQR dashboard keeps your enquiries and listings in one place.",
        ],
      },
      { type: "h2", text: "7. Tell people where to find you" },
      {
        type: "p",
        text: "An online store nobody knows about doesn't sell. The quickest win for market and shop sellers is a QR code people can scan on the spot. Put it on your stall sign, your counter, your bags and your business cards. We cover placement in [QR codes for market stalls](/guides/qr-code-for-market-stall).",
      },
      {
        type: "tip",
        text: "Add your shop link to your Instagram and Facebook bios too. Customers who follow you there are often the most likely to buy.",
      },
    ],
  },
  {
    slug: "qr-code-for-market-stall",
    title: "QR codes for market stalls: size, placement and what to link to",
    shortTitle: "QR codes for market stalls",
    description:
      "How to use a QR code on your market stall: how big to print it, where to put it, what it should link to, and how to get more scans from passers-by.",
    keywords: ["qr code market stall", "qr code for small business", "qr code sign", "market stall ideas nz", "print qr code"],
    published: "2026-10-08",
    updated: "2026-10-08",
    readMinutes: 6,
    intro:
      "A QR code turns a quick browse at your stall into a sale later. Someone likes your work but doesn't want to carry it around the market, or they're out of cash, or they want to think about it. One scan and your whole shop is in their pocket.",
    body: [
      { type: "h2", text: "What your QR code should link to" },
      {
        type: "p",
        text: "Link to somewhere people can buy, not just look. A QR code that opens your Instagram is better than nothing, but a shopper still has to message you, wait for a reply and arrange payment. Most won't. A code that opens your own shop lets them buy in under a minute.",
      },
      {
        type: "p",
        text: "Every myQR shop comes with a QR code that opens your shop directly, plus a code for each individual product. That second part is useful: stick an item's code next to it on the table and people can buy that exact thing.",
      },
      { type: "h2", text: "How big should a QR code be?" },
      {
        type: "p",
        text: "A reliable rule of thumb: the code should be about one-tenth of the distance people will scan it from. Someone reaching across your table is about 50 cm away, so a 5 cm code works. For a sign at the front of the stall that people read from a couple of metres away, go for 15–20 cm.",
      },
      {
        type: "ul",
        items: [
          "Price tags and swing tags: 2.5–3 cm.",
          "Counter cards and table tents: 6–8 cm.",
          "A4 stall signs: 14–18 cm.",
          "Banners read from across a walkway: 25 cm or more.",
        ],
      },
      { type: "h2", text: "Where to put it" },
      {
        type: "ol",
        items: [
          "At eye level at the front of the stall, where people pause. Not flat on the table under your products.",
          "Next to your price list or cash box, so people paying see it.",
          "On every bag, box or wrapping you hand over. The scan often happens at home.",
          "On business cards and flyers you give away.",
        ],
      },
      { type: "h2", text: "Give people a reason to scan" },
      {
        type: "p",
        text: "A bare QR code gets ignored. A line of text beside it doubles its usefulness. Tell people what they'll get: \"Scan to shop the full range\", \"Scan to order for delivery\", or \"Sold out? Scan to order more\". The printable signs in your myQR dashboard include this wording for you.",
      },
      { type: "h2", text: "Printing tips" },
      {
        type: "ul",
        items: [
          "Dark code on a light background. Light-on-dark codes fail on some phones.",
          "Leave a clear border around the code — at least the width of four of its small squares.",
          "Matte paper or laminate with a matte pouch. Gloss reflects the sun and blinds cameras at outdoor markets.",
          "Test it with two different phones before the market, from the distance customers will stand.",
        ],
      },
      {
        type: "tip",
        text: "Outdoor stall? Slide your sign into a plastic sleeve or laminate it. A code that's crumpled from yesterday's rain won't scan.",
      },
      { type: "h2", text: "Track whether it's working" },
      {
        type: "p",
        text: "myQR counts scans separately from other visits, so you can see which markets bring people back to your shop. If one market brings 40 scans and another brings 4, that's worth knowing when you're paying for stall fees.",
      },
    ],
  },
  {
    slug: "sell-online-from-your-market-stall",
    title: "How to sell online from your market stall: a four-weekend plan",
    shortTitle: "Sell online from your stall",
    description:
      "A practical four-weekend plan for market stall holders in NZ who want to start selling online, from listing products to printing QR codes and taking orders between markets.",
    keywords: ["sell online market stall", "market stall online shop", "farmers market online store", "craft market online sales nz"],
    published: "2026-10-08",
    updated: "2026-10-08",
    readMinutes: 6,
    intro:
      "Most stall holders sell for a few hours a week. Customers who miss you, run out of what they bought, or want a gift for someone else have nowhere to go until next market day. Here's a realistic plan to change that without taking over your life.",
    body: [
      { type: "h2", text: "Weekend one: set up and list your best sellers" },
      {
        type: "p",
        text: "Set aside an hour after you pack down. [Claim your shop name](/register), add your logo, and list the five products you sell most of. Take photos at the stall while you've got everything out — natural light under a gazebo is surprisingly good for product photos.",
      },
      { type: "h2", text: "Weekend two: put your QR code on the stall" },
      {
        type: "p",
        text: "Print the A4 stall sign from your dashboard and put it at the front of the stall. Add counter cards by your cash box. When people ask \"do you have a website?\", point at the sign. When someone hesitates over a purchase, tell them they can scan and buy later.",
      },
      { type: "h2", text: "Weekend three: fill out the range" },
      {
        type: "p",
        text: "Add the rest of your products, including things you don't bring to every market: large pieces, seasonal stock, custom orders. Your online shop has unlimited table space.",
      },
      { type: "h2", text: "Weekend four: follow up" },
      {
        type: "p",
        text: "Check your dashboard to see how many people scanned your code. Reply to enquiries quickly — people who message a small seller usually want an answer the same day. Mention your online shop in your social posts and add the link to your bio.",
      },
      { type: "h2", text: "What to sell online versus at the stall" },
      {
        type: "ul",
        items: [
          "Good online: items that post easily, gift sets, refills and restocks of things people already bought, made-to-order work.",
          "Better in person: fresh or chilled food, very fragile items, anything people need to try on or taste first.",
          "Either: offer pickup at your next market for items you can't post. Customers order ahead and you bring it along.",
        ],
      },
      {
        type: "tip",
        text: "Pickup at the next market is a quiet superpower. It guarantees sales before you've even set up, and the customer often buys something else when they collect.",
      },
    ],
  },
  {
    slug: "product-photos-with-your-phone",
    title: "Product photos with your phone: a simple setup for small sellers",
    shortTitle: "Product photos with your phone",
    description:
      "Take clean, consistent product photos with just your phone. Light, backgrounds, angles and editing tips for market stall and small shop sellers.",
    keywords: ["product photography phone", "how to take product photos", "product photos for online store", "small business photography tips"],
    published: "2026-10-08",
    updated: "2026-10-08",
    readMinutes: 5,
    intro:
      "Good product photos sell more than clever descriptions. You don't need a camera or a lightbox — a phone, a window and a sheet of card will do. What matters most is that your photos are bright, sharp and consistent.",
    body: [
      { type: "h2", text: "Light: use a window, not the flash" },
      {
        type: "p",
        text: "Set up beside a large window on an overcast day, or out of direct sun on a bright one. Side light from a window shows texture without harsh shadows. Turn off the flash and overhead lights — mixing light sources makes colours look strange.",
      },
      { type: "h2", text: "Background: plain and the same every time" },
      {
        type: "p",
        text: "A sheet of white or light grey card curved up against a wall gives a seamless background. Use the same one for every product so your shop looks tidy and deliberate. If your brand suits it, a wooden board or linen cloth works too — just stick with it.",
      },
      { type: "h2", text: "Five shots for every product" },
      {
        type: "ol",
        items: [
          "Straight-on hero shot, product filling most of the frame. This is the one in your shop grid.",
          "A 45-degree angle that shows depth.",
          "A close-up of texture, stitching, glaze or label.",
          "The product in use or in someone's hand, for scale.",
          "The back or underside, if people would want to see it.",
        ],
      },
      { type: "h2", text: "Phone settings that help" },
      {
        type: "ul",
        items: [
          "Wipe the lens. A greasy lens is the most common cause of hazy photos.",
          "Tap the screen on the product to focus, then slide down slightly to stop it looking too bright.",
          "Shoot from a little further back and crop, rather than using digital zoom.",
          "Keep the phone level — lean it against a mug if your hands are shaky.",
        ],
      },
      { type: "h2", text: "Editing: less is more" },
      {
        type: "p",
        text: "Your phone's built-in editor is enough. Straighten, crop to a square or 4:5 shape, lift the brightness slightly, and stop. Don't use filters that change the colour — customers who receive something that looks different from the photo are disappointed, and that costs you more than the sale.",
      },
      {
        type: "tip",
        text: "myQR shrinks your photos automatically before uploading, so they load quickly on a phone at the market even with weak reception.",
      },
    ],
  },
  {
    slug: "setting-shipping-prices-nz",
    title: "How to set shipping prices for small items in New Zealand",
    shortTitle: "Setting shipping prices in NZ",
    description:
      "A simple method for setting shipping prices on a small online store in NZ: weighing, packaging, rural delivery, flat rates and when to offer pickup instead.",
    keywords: ["shipping prices nz", "how much to charge for shipping nz", "courier small business nz", "online store shipping new zealand"],
    published: "2026-10-08",
    updated: "2026-10-08",
    readMinutes: 6,
    intro:
      "Shipping is where many small sellers quietly lose money. Charge too little and every order eats your margin; charge too much and people leave at checkout. Here's a straightforward way to get it right for each product.",
    body: [
      { type: "h2", text: "Step 1: pack it, then weigh and measure it" },
      {
        type: "p",
        text: "Don't guess from the product weight. Pack one item exactly as you'd send it — box or courier bag, padding, tape, any card you include — and weigh it on kitchen scales. Measure the box too, because couriers charge on size as well as weight for bulky parcels.",
      },
      { type: "h2", text: "Step 2: check real rates" },
      {
        type: "p",
        text: "Look up current prices with NZ Post and one or two courier companies for your packed size and weight. Prepaid courier bags and tickets can be cheaper if you send regularly. Rates change, so recheck a couple of times a year.",
      },
      { type: "h2", text: "Step 3: add your packaging cost" },
      {
        type: "p",
        text: "Boxes, mailers, tissue and tape add up. Work out roughly what each parcel costs you in materials and add it to the courier price. Round up to a tidy number.",
      },
      { type: "h2", text: "Step 4: plan for rural delivery" },
      {
        type: "p",
        text: "Parcels to rural addresses usually cost more to send. You can build an average into your price, or note in your item description that rural delivery may cost extra. Being upfront avoids awkward messages after the sale.",
      },
      { type: "h2", text: "Flat rate, per item, or free?" },
      {
        type: "ul",
        items: [
          "Per-item shipping (how myQR works today) is the most accurate when your products vary a lot in size.",
          "Free shipping works when your margin can absorb it. Build the cost into the product price rather than eating it.",
          "Pickup only is right for fragile, heavy or perishable products. Offer pickup from your stall, shop or home.",
        ],
      },
      { type: "h2", text: "Make it clear on every listing" },
      {
        type: "p",
        text: "In myQR each listing shows its own shipping price and whether pickup is available, so shoppers know the total before they ask. Add your pickup details — where and when — in your shop settings.",
      },
      {
        type: "tip",
        text: "Keep a small table of your packed weights and costs on your phone. When a customer asks about a combined order, you can quote it on the spot.",
      },
    ],
  },
  {
    slug: "writing-product-descriptions",
    title: "Writing product descriptions that sell (and get found on Google)",
    shortTitle: "Writing product descriptions",
    description:
      "How small sellers can write product names and descriptions that answer buyers' questions and help their online store show up in Google searches.",
    keywords: ["write product descriptions", "product description examples", "seo for small online store", "get online store on google"],
    published: "2026-10-08",
    updated: "2026-10-08",
    readMinutes: 5,
    intro:
      "At your stall you can answer every question a customer has. Online, your description has to do that for you. The good news: descriptions that answer real questions are also the ones Google likes to show.",
    body: [
      { type: "h2", text: "Start with a plain, searchable name" },
      {
        type: "p",
        text: "Name products the way people search for them. \"Hand-thrown ceramic mug, speckled white, 350ml\" will be found; \"Morning Cloud\" won't. You can keep a creative name — just put the plain description first or alongside it.",
      },
      { type: "h2", text: "Answer the questions people ask at your stall" },
      {
        type: "p",
        text: "Think about what customers ask you in person and answer it in writing:",
      },
      {
        type: "ul",
        items: [
          "How big is it? Give measurements, weight or volume.",
          "What's it made of, or what's in it?",
          "How do I look after it, store it or use it?",
          "Is each one different? Handmade variations are a selling point — say so.",
          "Can I get it posted, or is it pickup only?",
        ],
      },
      { type: "h2", text: "Say where it's from" },
      {
        type: "p",
        text: "Local matters to buyers and to search. Mention your town or region and anything distinctive about how it's made: \"made in our Whangārei workshop\", \"honey from hives in the Far North\". People searching for local products are often ready to buy.",
      },
      { type: "h2", text: "Keep it short and scannable" },
      {
        type: "p",
        text: "Three to six sentences is plenty for most products. Put the most important information first. Most of your shoppers will be on a phone, often standing at a market.",
      },
      { type: "h2", text: "Your shop's own search settings" },
      {
        type: "p",
        text: "myQR builds your page titles and descriptions for Google automatically from your shop name, tagline and product details. If you want to fine-tune them, each shop and product has an optional search title and description in the dashboard.",
      },
    ],
  },
  {
    slug: "pricing-handmade-products",
    title: "How to price handmade products for markets and online",
    shortTitle: "Pricing handmade products",
    description:
      "A simple formula for pricing handmade and small-batch products in NZ so you cover materials, time, fees and still make a profit, at markets and online.",
    keywords: ["how to price handmade products", "pricing crafts nz", "market stall pricing", "pricing formula small business"],
    published: "2026-10-08",
    updated: "2026-10-08",
    readMinutes: 6,
    intro:
      "Underpricing is the most common mistake makers make. It feels friendly at the stall, but it leaves no room for stall fees, card fees, wholesale orders or a day off. Here's a formula that keeps you honest.",
    body: [
      { type: "h2", text: "The basic formula" },
      {
        type: "p",
        text: "Materials + your time + overheads = your cost. Your cost + profit = your price. Each part matters, and most people leave out at least one.",
      },
      { type: "h3", text: "Materials" },
      {
        type: "p",
        text: "Add up everything that goes into one item, including packaging, labels and the bits you buy in bulk. If a bag of 100 jar lids costs $40, that's 40 cents per jar.",
      },
      { type: "h3", text: "Your time" },
      {
        type: "p",
        text: "Time yourself making a batch and divide by the number of items. Decide what an hour of your time is worth — at least the minimum wage — and multiply. If that makes the price feel too high, look for ways to make things faster, not for ways to work for free.",
      },
      { type: "h3", text: "Overheads" },
      {
        type: "p",
        text: "Stall fees, gazebo, travel, card machine fees, online store fees, website costs. Add up a month of these and divide by how many items you sell in a month.",
      },
      { type: "h2", text: "Check the price against the market" },
      {
        type: "p",
        text: "Look at what similar products sell for at other stalls and online. If your formula price is well above, show buyers why yours is different — materials, size, local origin, craftsmanship — in your photos and description. If it's well below, you've probably undervalued your time.",
      },
      { type: "h2", text: "Keep online and stall prices the same" },
      {
        type: "p",
        text: "Matching prices builds trust: a customer who scans your QR code at the stall should see the same price online. Use shipping to cover delivery costs rather than raising the online price.",
      },
      {
        type: "tip",
        text: "Review prices every six months. Material costs creep up, and a small regular increase is easier on customers than a big jump.",
      },
    ],
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug) ?? null;
}
