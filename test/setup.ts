import "dotenv/config";

// Transactional email is exercised through the Edge Function, never from tests.
process.env.SENDGRID_API_KEY = "";
