# Goodfood home kitchen manager

A small React app for keeping home-cooked food customer, menu, order, and promotion records.

## Run it

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production build, run `npm run build`.

## What it does

- Stores customer contact details, customer type, notes, and promotional-message consent.
- Maintains a food menu with compressed photos and availability.
- Records orders with item/price snapshots and tracks their status.
- Creates promotions for one customer type and opens individual SMS or WhatsApp message drafts for opted-in customers.
- Exports all saved records as a JSON backup from the top bar.

Prices are entered in your local currency. Records are stored in this browser on this device using localStorage; they are not synced between devices and are not a substitute for a secure hosted database. Export backups regularly. Messaging drafts open in your device's messaging app and are not sent automatically; confirm customer permission and follow local privacy and messaging requirements.
