-- One provider intent (Stripe/PayPal) backs at most one Payment row: DB-level backstop against two
-- concurrent booking-creates (same succeeded card intent) minting two paid bookings. NULLs stay
-- distinct in Postgres, so bank/crypto/cash payments keep NULL providerRef freely.
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");
