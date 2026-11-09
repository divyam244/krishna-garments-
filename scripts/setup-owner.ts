// Bootstrap the owner account from environment variables.
// Reads OWNER_USERNAME / OWNER_PASSWORD from .env (gitignored) and stores
// them as an Argon2id hash. The plaintext password never lands in code.
//
// Idempotent: running it again repairs the account if the hash is missing.

import "server-only";
import { ensureOwnerAccount } from "@/lib/auth/owner";

async function main() {
  try {
    const { created } = await ensureOwnerAccount();
    if (created) {
      console.log("owner account created from .env credentials (hashed with Argon2id).");
      console.log(
        "\nPassword change is enforced on first login.\n" +
        "Set SAMPLE_DATA=true and run `npm run db:seed` to populate the catalog with sample data.\n"
      );
    } else {
      console.log("owner account already exists; nothing changed.");
    }
  } catch (e) {
    console.error("owner bootstrap failed:", (e as Error).message);
    process.exit(1);
  }
}

main();
