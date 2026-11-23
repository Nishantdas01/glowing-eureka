# Goodfood home kitchen manager

A small React app for keeping home-cooked food customer, menu, order, and promotion records.

## Run it

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production build, run `npm run build`.

## Install on mobile

The app is an installable Progressive Web App (PWA). Open the deployed site in your mobile browser and install/add it to your home screen. In supported browsers, use **Install app** when it appears; on iPhone, use Safari's **Share → Add to Home Screen**. The app shell is cached for offline opening, and records remain stored locally in that browser on that device.

## मोबाइल पर इंस्टॉल करें

यह ऐप इंस्टॉल करने योग्य PWA है। मोबाइल ब्राउज़र में साइट खोलें और इसे होम स्क्रीन पर जोड़ें। समर्थित ब्राउज़र में **ऐप इंस्टॉल करें** चुनें; iPhone पर Safari में **Share → Add to Home Screen** चुनें। ऐप ऑफ़लाइन खुल सकता है और रिकॉर्ड उसी डिवाइस के ब्राउज़र में स्थानीय रूप से सहेजे जाते हैं।

## What it does

- Stores customer contact details, customer type, notes, and promotional-message consent.
- Maintains a food menu with compressed photos and availability.
- Records orders with item/price snapshots and tracks their status.
- Creates promotions for one customer type and opens individual SMS or WhatsApp message drafts for opted-in customers.
- Exports all saved records as a JSON backup and restores one from the top bar.

Prices are entered in your local currency. Records are stored in this browser on this device using localStorage; they are not synced between devices and are not a substitute for a secure hosted database. Export backups regularly. Messaging drafts open in your device's messaging app and are not sent automatically; confirm customer permission and follow local privacy and messaging requirements.
