---
title: How we built a custom payment gateway integration for GoHighLevel
description: GHL only supports Stripe, PayPal, NMI and Authorize.net. Here is how we connected SSLCommerz as a custom payment provider, end to end.
date: 2026-10-05
author: Farhad Hossen
category: Integrations
cover:
  art: gateway
---

Here’s the problem we started with. A business in Dhaka can do almost everything inside GoHighLevel. They can build the funnel. They can write the emails. They can set up the workflow that tags a buyer and books a call. Then the customer clicks Pay, and the whole thing falls apart. GHL wants Stripe. Stripe doesn’t work in Bangladesh.

So we built the missing piece. It’s called GHL-SSLPay. It plugs SSLCommerz into GoHighLevel as a real payment provider, so payments work the same way they would with Stripe.

This post walks through why we built it, how it works, and what broke along the way. If you’re trying to connect your own local gateway to GHL, the same approach will work for you.

## The problem: GoHighLevel only speaks four payment languages

Out of the box, GoHighLevel supports four payment providers: Stripe, PayPal, NMI, and Authorize.net.

That sounds like plenty until you look closer.

Stripe is the important one. It’s the only provider wired into every part of the platform. Memberships, calendar payments, text-to-pay, SaaS mode, most of it needs Stripe. PayPal only covers order forms and affiliate payouts. NMI and Authorize.net are built for North America.

Now think about where that leaves everyone else. Stripe isn’t available in Bangladesh. It isn’t available in big parts of Latin America, Africa, and Southeast Asia. Those businesses can use GoHighLevel for everything except the one step that makes them money.

### The workarounds don’t work

Before we built anything, we watched people try to patch around this. Three common attempts, and why each one fails:

**Manual invoicing.** The business sends a payment link by hand, outside GHL. The customer pays. Then nothing happens. No tag gets added. No workflow fires. No calendar booking. You’ve kept the payment and thrown away the automation.

**Zapier bridges.** Zapier can move data after the fact, but it can’t be a checkout. There’s no order form, no upsell, no subscription state. You’re gluing a receipt onto a funnel that never really processed a sale.

**Charging in USD anyway.** Some try to use Stripe through a foreign entity and bill customers in dollars. Local cards get declined. Customers see a foreign currency and leave. The ones who do pay eat a conversion fee.

This is the part most people miss. It isn’t really a payments problem. **It’s a lost automation problem.** The payment is just one click. The value of GoHighLevel is everything that happens in the ten seconds after that click. Break the payment step and you lose the whole chain.

## Why we chose SSLCommerz

SSLCommerz is the default way Bangladesh pays online.

It handles local and international cards. More importantly, it handles mobile wallets like bKash, Nagad, and Rocket, which is how a huge share of the country actually pays for things. It also covers net banking, and it bills in taka.

So the setup was almost funny. On one side, a mature CRM used by businesses everywhere. On the other side, a mature payment gateway trusted across the country. Between them, nothing.

We built the bridge.

## What GoHighLevel’s custom payment provider framework actually is

Here’s the good news, and a lot of GHL users still don’t know it: **you are not stuck with those four providers.**

In 2024, HighLevel opened up custom payments. Their position is that the platform should be payments-agnostic. If your gateway has a public API, you can register it as a payment provider and use it anywhere GHL takes money. You can read their [official guide to building a custom payments integration](https://help.gohighlevel.com/support/solutions/articles/155000002620-how-to-build-a-custom-payments-integration-on-the-platform) for the full spec.

A custom payment provider has four moving parts. In plain English:

**1. The Marketplace App.** This is the wrapper. It handles login permissions and tells GHL your app exists.

**2. The settings page.** GHL loads your page inside an iframe. This is where the business owner types in their gateway credentials. They never leave GHL.

**3. The checkout page.** When a customer is ready to pay, GHL loads this page inside the order form. Your job is to take it from there.

**4. The query endpoint.** This one is invisible to users and the most important. It’s a backend address on your server. GHL calls it directly, server to server, to ask things like “did that payment actually go through?” or “refund this charge.”

Once those four pieces exist, something nice happens. Your gateway stops being a bolt-on. It shows up in GHL’s payment settings like any built-in option, and it works across funnels, order forms, invoices, and memberships.

## How GHL-SSLPay works

Let’s follow one payment from start to finish.

### Step 1: The business installs the app

The business owner finds our app in the GHL Marketplace and clicks install. GHL sends them to our callback URL with a one-time code. We trade that code for access tokens and save them, tied to that specific sub-account.

### Step 2: They connect their gateway

GHL opens our settings page inside an iframe. They type in their SSLCommerz Store ID, their store password, and pick sandbox or live mode. Then they save.

Behind the scenes, that one click does more than store a password. The first time they save, we automatically register them with GoHighLevel’s Custom Provider API, both the provider setup and the API keys. HighLevel’s docs show this as a couple of cURL commands a developer runs by hand. We hid that completely. The business owner fills in two fields and is done.

This matters more than it sounds. If setup needs a developer, the integration doesn’t scale. If it’s two fields, an agency can onboard clients themselves.

### Step 3: A customer pays

Here’s where it gets interesting.

GHL loads our checkout page inside an iframe on the order form. Our page talks to our server, which creates a payment session with SSLCommerz and gets back a secure payment URL.

Then we have to send the customer to that URL, and we **cannot** do it inside the iframe.

This is the single trickiest part of the whole build. Hosted payment pages refuse to load inside a nested frame, and for good reason. It’s a classic way to fake a checkout screen. SSLCommerz blocks it. So does every serious gateway.

So our checkout page sends a message up to the GHL page that contains it, asking the browser to move the whole window to the payment page, not just the little frame. We also have to carry the order details along so that when the customer comes back, we know which payment they just made.

Get this wrong and you see one of two things: a blank white box where checkout should be, or a customer who pays successfully and lands back on a page that has no idea who they are. We hit both before we got it right.

### Step 4: The payment finishes

The customer pays on SSLCommerz’s own page, using a card or bKash or whatever they prefer.

Then SSLCommerz tells us what happened, twice, on purpose.

First, it redirects the customer’s browser back to us, to a success, fail, or cancel URL. Second, it sends a separate message from its own servers directly to ours. That’s the IPN, or Instant Payment Notification.

Why both? Because browser redirects lie. The customer closes the tab. Their phone loses signal on the train. The redirect never arrives, but the money absolutely moved. **The browser redirect is for the customer’s experience. The IPN is the truth.** We treat it that way.

On success, we also do a server-to-server validation call back to SSLCommerz before we mark anything as paid. We never trust what the browser hands us.

### Step 5: GoHighLevel confirms

GHL then calls our query endpoint and asks us to confirm the payment. We check our records and answer.

That’s the moment everything else unlocks. GHL marks the order as paid. Tags get added. The workflow runs. The confirmation email goes out. The calendar event books. The customer paid in taka with a mobile wallet, and GHL treated it exactly like a Stripe charge.

### One build, every sub-account

Credentials are stored per location. One deployment serves an entire agency’s client base, and every client uses their own SSLCommerz account with their own money going to their own bank.

For an agency, this is the part that matters. You don’t build this once per client. You build it once.

## The hard parts, and how we solved them

Anyone can say they connected two systems. Here’s what actually took the time.

### Storing other people’s passwords

We’re holding SSLCommerz store passwords for many businesses. A leaked database would be a disaster for all of them at once.

Every password is encrypted with AES-256-GCM before it touches the database, using a key that lives in the environment, not in the code. A stolen database dump is useless on its own.

### Making sure a webhook is really from SSLCommerz

Our IPN endpoint sits on the open internet. Anyone can send it a fake “payment successful” message and try to get a free product.

Two defenses. First, we verify the signature on every IPN by rebuilding the hash using our own store password, exactly as SSLCommerz specifies. If it doesn’t match, we drop it. Second, we independently validate the transaction with SSLCommerz before marking it paid.

### Never crediting the same payment twice

Webhooks retry. That’s normal and good, because it’s how you survive a brief outage. But if the same message arrives three times and you process it three times, you’ve triple-counted one sale.

Every payment carries a unique validation ID. We record it. If we see it again, we acknowledge the message and do nothing. The second and third copies are harmless.

### Keeping the checkout out of the wrong hands

Our pages are meant to load inside GoHighLevel and nowhere else. A frame-ancestors policy enforces that at the browser level. If someone embeds our checkout on their own site to harvest payment details, the browser refuses to render it.

### Surviving abuse

Each endpoint has its own rate limit. The IPN webhook, the query endpoint, and the login endpoint all get different ceilings based on normal traffic. The IPN endpoint can also be locked to SSLCommerz’s own IP addresses in production.

### Being able to debug it later

Three systems are involved in every payment. When something goes wrong, “it didn’t work” is not a useful bug report.

So we log every inbound webhook and every query from GHL into an audit table. When a merchant says a payment didn’t show up, we can pull up the exact messages we received, in order, with timestamps. Most support questions get answered in a couple of minutes instead of a couple of days.

## The honest limitation: recurring payments

We’d rather tell you this up front than have you find out after signing a contract.

Here’s where recurring billing stands:

| Payment type | Works? |
|---|---|
| One-time payments | Yes, fully |
| GHL manual subscriptions (new invoice each cycle) | Yes |
| SaaS mode | Partly. Checkout works, automatic charges don’t |
| Automatic charges to a saved card | No, not by default |

The reason is on the gateway’s side, not ours. Charging a saved card without the customer present requires card tokenization, and SSLCommerz turns that on per merchant account only after approval. Any merchant can request it by contacting SSLCommerz directly. Until it’s approved, nobody can build automatic recurring charges on that account. Not us, not anyone.

There’s a lesson here that applies to every gateway, not just this one. **Every payment gateway has a ceiling.** Some don’t do refunds through the API. Some have no sandbox. Some won’t do saved cards.

The job of a good integration partner is to find that ceiling during discovery and tell you about it, not to discover it halfway through the build and send you a change order.

## Can we do this for your payment gateway?

Short answer: if your gateway has a public API, almost certainly yes.

The gateway doesn’t have to be famous. It has to be documented. Here’s the checklist we run before quoting any custom payment gateway integration for GoHighLevel:

- **Public API documentation.** Real docs, not a PDF from 2019.
- **A sandbox or test mode.** We’re not testing with live money.
- **A hosted checkout page or card tokenization.** One or the other. Hosted is faster and keeps card data off everyone’s servers.
- **Server-side transaction validation.** A way for us to ask the gateway “is this payment real?” and trust the answer.
- **Webhooks with a verifiable signature.** Notifications we can prove came from the gateway.
- **A refund endpoint.** GHL will ask for refunds. We need somewhere to send them.

Hit all six and the build is straightforward. Miss one or two and it’s usually still possible, just with tradeoffs we’ll explain before you commit.

The process looks like this: discovery and API review, sandbox build, marketplace app setup, end-to-end testing with real test cards, then production rollout and merchant onboarding.

We’ve done this for SSLCommerz. The same framework applies to Razorpay, PayU, Paystack, Flutterwave, Mercado Pago, Midtrans, iyzico, Paymob, bKash, and most regional processors you can name.

## Frequently asked questions

<details>
<summary>Can you integrate any payment gateway with GoHighLevel?</summary>

Almost any. The gateway needs a public API, a test environment, and a way to verify transactions server-side. If it has those, it can be built as a GoHighLevel custom payment provider. Obscure or regional gateways are fine. We check the API first and tell you before you commit.

</details>

<details>
<summary>Does a custom payment provider work with funnels, order forms, and memberships?</summary>

Yes. Once registered, your gateway appears in GHL’s payment settings like any built-in option. It works across funnels, order forms, invoices, and memberships, and payments trigger tags and workflows exactly as Stripe payments do.

</details>

<details>
<summary>Will it support recurring subscriptions?</summary>

It depends on your gateway. Manual subscriptions, where GHL issues a fresh invoice each cycle, work with any gateway. Automatic charges to a saved card need card tokenization, which not every gateway offers and many enable only on request. We confirm this during discovery.

</details>

<details>
<summary>Can one integration serve all of my agency’s sub-accounts?</summary>

Yes. Credentials are stored per sub-account, so one deployment serves your whole client base. Each client connects their own merchant account and receives their own money. You build once and onboard clients in minutes.

</details>

<details>
<summary>Is a custom payment integration PCI compliant?</summary>

With a hosted checkout, card details go straight to the gateway and never touch our servers, which keeps your compliance burden small. We encrypt stored credentials with AES-256-GCM, verify every webhook signature, and rate-limit public endpoints.

</details>

<details>
<summary>How long does a custom GoHighLevel payment integration take to build?</summary>

It depends on how clean the gateway’s API is and whether tokenization is involved. We give a firm timeline after reviewing the API docs and sandbox during discovery, before any work starts.

</details>

<details>
<summary>What happens if the gateway changes its API?</summary>

Gateways do update. We monitor for changes, keep the audit log so problems surface fast, and handle maintenance under an ongoing support arrangement so an API change never becomes a weekend of broken checkouts.

</details>

## The takeaway

GoHighLevel is a strong platform with a narrow payment list. That list is a business decision, not a technical wall, and HighLevel left the door open on purpose.

If your gateway isn’t supported, you have three options. Work around it and lose your automation. Wait and hope HighLevel adds it. Or build the bridge.

We built the bridge for SSLCommerz in Bangladesh. We can build it for yours.

Tell us which gateway you need, and we’ll tell you on one call whether it’s buildable and what it would take.
