import { seedDatabase, disconnectSeed } from "../src/repositories/seed";

try { await seedDatabase(); }
finally { await disconnectSeed(); }
